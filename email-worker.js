/**
 * Strateon Email Worker
 * Reads inbox, processes client inquiries, can send emails
 * Run via: node email-worker.js [action]
 * Actions: read-inbox, send-test
 */

const Imap = require('/home/node/.openclaw/imap-worker/node_modules/imap');
const nodemailer = require('/home/node/.openclaw/imap-worker/node_modules/nodemailer');
const fs = require('fs');

const creds = JSON.parse(fs.readFileSync('/home/node/.openclaw/secrets/strateon-email.json', 'utf8'));

const imap = new Imap({
  user: creds.user,
  password: creds.password,
  host: creds.imap.host,
  port: creds.imap.port,
  tls: creds.imap.tls,
  tlsOptions: { rejectUnauthorized: false }
});

const transporter = nodemailer.createTransport({
  host: creds.smtp.host,
  port: creds.smtp.port,
  secure: creds.smtp.secure,
  auth: {
    user: creds.user,
    pass: creds.password
  },
  tls: {
    rejectUnauthorized: false
  }
});

function readInbox(callback) {
  imap.openBox('INBOX', true, function(err, box) {
    if (err) {
      callback(err, null);
      return;
    }
    
    const messages = [];
    const fetch = imap.seq.fetch('1:*', {
      bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)',
      struct: true
    });

    fetch.on('message', function(msg, seqno) {
      msg.on('body', function(stream, info) {
        let buffer = '';
        stream.on('data', function(chunk) {
          buffer += chunk.toString('utf8');
        });
        stream.once('end', function() {
          messages.push({
            seqno: seqno,
            header: buffer
          });
        });
      });
    });

    fetch.once('error', function(err) {
      callback(err, null);
    });

    fetch.once('end', function() {
      callback(null, { total: box.messages.total, messages: messages });
    });
  });
}

function getRecentEmails(sinceHours, callback) {
  imap.openBox('INBOX', true, function(err, box) {
    if (err) {
      callback(err, null);
      return;
    }

    const since = new Date();
    since.setHours(since.getHours() - sinceHours);
    const sinceStr = since.toISOString();

    const fetch = imap.seq.fetch('1:*', {
      bodies: 'HEADER.FIELDS (FROM SUBJECT DATE)',
      struct: true
    });

    const emails = [];
    fetch.on('message', function(msg, seqno) {
      msg.on('body', function(stream, info) {
        let buffer = '';
        stream.on('data', function(chunk) {
          buffer += chunk.toString('utf8');
        });
        stream.once('end', function() {
          const header = require('mailparser').Headers.parse(buffer);
          emails.push({
            seqno: seqno,
            from: header.from,
            subject: header.subject,
            date: header.date
          });
        });
      });
    });

    fetch.once('end', function() {
      imap.end();
      const recent = emails.filter(e => !e.date || new Date(e.date) >= since);
      callback(null, { total: emails.length, recent: recent });
    });
  });
}

function sendEmail(to, subject, body, callback) {
  const mailOptions = {
    from: creds.user,
    to: to,
    subject: subject,
    text: body,
    html: body.replace(/\n/g, '<br>')
  };

  transporter.sendMail(mailOptions, function(err, info) {
    if (err) {
      callback(err, null);
    } else {
      callback(null, { messageId: info.messageId, accepted: info.accepted });
    }
  });
}

// CLI handler
const action = process.argv[2] || 'read-inbox';

if (action === 'read-inbox') {
  imap.on('ready', function() {
    readInbox(function(err, result) {
      if (err) {
        console.log('Error:', err.message);
        process.exit(1);
      }
      console.log(JSON.stringify(result, null, 2));
      imap.end();
    });
  });
  imap.on('error', function(err) {
    console.log('IMAP Error:', err.message);
    process.exit(1);
  });
  imap.connect();

} else if (action === 'read-recent') {
  const hours = parseInt(process.argv[3]) || 24;
  imap.on('ready', function() {
    getRecentEmails(hours, function(err, result) {
      if (err) {
        console.log('Error:', err.message);
        process.exit(1);
      }
      console.log(JSON.stringify(result, null, 2));
    });
  });
  imap.on('error', function(err) {
    console.log('IMAP Error:', err.message);
    process.exit(1);
  });
  imap.connect();

} else if (action === 'send-test') {
  const testEmail = process.argv[3] || 'ahmad.salim@getstrateon.com';
  sendEmail(testEmail, 'Strateon Email System Test', 'This is a test email from Moosa.', function(err, result) {
    if (err) {
      console.log('Error:', err.message);
      process.exit(1);
    }
    console.log('Email sent:', JSON.stringify(result));
    process.exit(0);
  });

} else if (action === 'send-proposal') {
  // Usage: node email-worker.js send-proposal <to> <subject> <body>
  const to = process.argv[3];
  const subject = process.argv[4] || 'Strateon Proposal';
  const body = process.argv[5] || '';
  if (!to) {
    console.log('Usage: node email-worker.js send-proposal <to> <subject> <body>');
    process.exit(1);
  }
  sendEmail(to, subject, body, function(err, result) {
    if (err) {
      console.log('Error:', err.message);
      process.exit(1);
    }
    console.log('Proposal sent:', JSON.stringify(result));
    process.exit(0);
  });

} else {
  console.log('Unknown action:', action);
  console.log('Available: read-inbox, read-recent [hours], send-test [to], send-proposal <to> <subject> <body>');
  process.exit(1);
}