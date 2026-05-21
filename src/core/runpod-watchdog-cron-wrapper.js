#!/usr/bin/env node
/**
 * runpod-watchdog-cron-wrapper — Phase D-2.3
 * Cron-safe wrapper for runpod-watchdog.js
 *
 * Features:
 * - Single-run lock (prevents overlapping watchdog runs)
 * - GPU active window gating (06:00–21:00 UTC)
 * - Cost-risk alert when pod is RUNNING outside approved window
 * - Clean exit handling
 * - Sanitized logging
 *
 * Usage:
 *   node runpod-watchdog-cron-wrapper.js
 *
 * Cron entry (PROPOSED — NOT ACTIVATED):
 * 0,10,20,30,40,50 6-21 * * * /usr/bin/node /home/node/.openclaw/workspace/src/core/runpod-watchdog-cron-wrapper.js
 *
 * Active window: 06:00 UTC to 21:00 UTC
 * = 11:00 PKT to 02:00 PKT next day
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// === PATH CONFIG ===

const WORKSPACE = '/home/node/.openclaw/workspace';
const STATE_DIR = path.join(WORKSPACE, 'state');
const LOCK_FILE = path.join(STATE_DIR, 'runpod-watchdog.lock');
const WATCHDOG_SCRIPT = path.join(__dirname, 'runpod-watchdog.js');
const ALERT_ADAPTER = path.join(__dirname, 'runpod-alert-adapter.js');
const LOG_FILE = path.join(WORKSPACE, 'ops', 'gpu-watchdog-cron.log');

// === WINDOW CONFIG ===

const WINDOW_START_HOUR_UTC = 6;  // 06:00 UTC = 11:00 PKT
const WINDOW_END_HOUR_UTC = 20;  // stops at 20:50 UTC = 01:50 PKT (cron last run 20:50)

// === HELPERS ===

function timestamp() {
    return new Date().toISOString();
}

function log(msg) {
    const line = '[' + timestamp() + '] ' + msg;
    console.log(line);
    fs.appendFileSync(LOG_FILE, line + '\n');
}

function isWithinActiveWindow() {
    const now = new Date();
    const hour = now.getUTCHours();
    return hour >= WINDOW_START_HOUR_UTC && hour < WINDOW_END_HOUR_UTC;
}

function isWithinActiveWindowReason() {
    const now = new Date();
    const hour = now.getUTCHours();
    const pkHour = hour + 5; // PKT = UTC + 5
    if (hour >= WINDOW_START_HOUR_UTC && hour < WINDOW_END_HOUR_UTC) {
        return 'WITHIN_WINDOW';
    }
    return 'OUTSIDE_WINDOW';
}

// === LOCK ===

function acquireLock() {
    if (fs.existsSync(LOCK_FILE)) {
        const lockAge = Date.now() - fs.statSync(LOCK_FILE).mtimeMs;
        const lockAgeMin = Math.floor(lockAge / 60000);
        if (lockAge > 15 * 60 * 1000) {
            // Lock older than 15 minutes — stale, remove it
            log('LOCK stale (' + lockAgeMin + 'm), removing and proceeding');
            fs.unlinkSync(LOCK_FILE);
        } else {
            log('SKIP: Another watchdog run in progress (lock age: ' + lockAgeMin + 'm)');
            return false;
        }
    }
    fs.writeFileSync(LOCK_FILE, JSON.stringify({
        pid: process.pid,
        startedAt: timestamp()
    }));
    return true;
}

function releaseLock() {
    try {
        if (fs.existsSync(LOCK_FILE)) fs.unlinkSync(LOCK_FILE);
    } catch {}
}

// === CHECK POD STATUS FOR WINDOW VIOLATION ===

function checkWindowViolation() {
    try {
        const SECRETS_FILE = '/home/node/.openclaw/secrets/runpod.json';
        const REST_BASE = 'https://rest.runpod.io/v1';
        const secrets = JSON.parse(fs.readFileSync(SECRETS_FILE, 'utf8'));

        const raw = execSync(
            'curl -s -X GET ' +
            '-H "Authorization: Bearer ' + secrets.api_key + '" ' +
            '-H "Content-Type: application/json" ' +
            '"' + REST_BASE + '/pods/' + secrets.pod_id + '" ' +
            '--max-time 20 --connect-timeout 15',
            { encoding: 'utf8', maxBuffer: 5 * 1024 * 1024 }
        );
        const d = JSON.parse(raw);

        if (d.desiredStatus === 'RUNNING') {
            return {
                isRunning: true,
                podId: d.id,
                costPerHr: d.costPerHr,
                note: 'Pod RUNNING outside active window — billing active'
            };
        }
        return { isRunning: false };
    } catch (e) {
        return { isRunning: false, error: e.message };
    }
}

// === OUT-OF-WINDOW ALERT ===

function alertWindowViolation(alert) {
    try {
        if (fs.existsSync(ALERT_ADAPTER)) {
            const { sendGPUAlert } = require(ALERT_ADAPTER);
            sendGPUAlert(
                'HIGH',
                'GPU_OUT_OF_WINDOW',
                alert.podId || 'unknown',
                'RunPod API',
                alert.statusCode || 'RUNNING_OUTSIDE_WINDOW',
                { note: alert.note, costPerHr: alert.costPerHr }
            );
        }
    } catch {}
}

// === MAIN ===

function main() {
    // Always clean lock on exit
    process.on('exit', () => releaseLock());
    process.on('SIGINT', () => { releaseLock(); process.exit(0); });
    process.on('SIGTERM', () => { releaseLock(); process.exit(0); });

    log('=== Watchdog cron wrapper started ===');

    // Step 1: Acquire lock
    if (!acquireLock()) {
        log('SKIP: Lock held by another process');
        process.exit(0);
    }

    // Step 2: Check active window
    const withinWindow = isWithinActiveWindow();
    const windowReason = isWithinActiveWindowReason();

    if (!withinWindow) {
        log('OUTSIDE_ACTIVE_WINDOW: hour=' + new Date().getUTCHours() + ' UTC — checking pod status');

        // Check if pod is running (would be billing)
        const violation = checkWindowViolation();
        if (violation.isRunning) {
            log('ALERT: Pod is RUNNING and billing while outside approved window');
            alertWindowViolation({
                podId: violation.podId,
                statusCode: 'RUNNING_OUTSIDE_WINDOW',
                costPerHr: violation.costPerHr,
                note: violation.note
            });
        } else {
            log('OK: Pod not running, no billing concern');
        }

        releaseLock();
        log('EXIT: Outside active window');
        process.exit(0);
    }

    log('WITHIN_ACTIVE_WINDOW — proceeding with watchdog');

    // Step 3: Run watchdog
    try {
        execSync(
            'node ' + WATCHDOG_SCRIPT,
            {
                stdio: 'inherit',
                cwd: WORKSPACE,
                timeout: 120 * 1000 // 2 minute timeout
            }
        );
        log('Watchdog run completed');
    } catch (e) {
        log('ERROR: Watchdog exited with code ' + (e.status || 'unknown'));
    }

    // Step 4: Release lock
    releaseLock();
    log('=== Watchdog cron wrapper finished ===\n');
    process.exit(0);
}

main();