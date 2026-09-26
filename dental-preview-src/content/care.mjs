// Care content: 11 proposed categories on 9 pages. Two pairs share a page
// because patients usually weigh them against each other: fillings vs crowns,
// and saving a tooth (root canal care) vs removing it (extraction). Implants
// sit inside a wider "replacing a missing tooth" comparison. Every category
// keeps its own anchor (#id) so it can be linked directly.
//
// Status for every topic: availability NOT confirmed by the clinic; clinical
// review pending by a named local clinician. Nothing here says a procedure is
// performed at this practice. Copy is original, drafted from `sources`.

export const careStatus = {
  availability: 'not-confirmed',
  clinicalReview: 'pending',
  reviewer: null,
  reviewedOn: null,
};

export const careGroups = [
  { name: 'Everyday and preventive care', pages: ['checkups-and-cleaning', 'gum-care', 'childrens-dentistry'] },
  { name: 'Repairing and saving teeth', pages: ['fillings-and-crowns', 'root-canal-and-extraction'] },
  { name: 'Replacing teeth', pages: ['replacing-a-missing-tooth'] },
  { name: 'Alignment and appearance', pages: ['orthodontics-and-aligners', 'whitening'] },
  { name: 'When something hurts', pages: ['urgent-dental-concerns'] },
];

// "Start with a concern": plain-language entry points into the care pages.
export const concerns = [
  { q: 'My gums bleed when I brush', to: 'gum-care', anchor: 'gum-care' },
  { q: "It's been a long time since my last check-up", to: 'checkups-and-cleaning', anchor: 'checkups-and-cleaning' },
  { q: 'A tooth is sensitive or has a hole', to: 'fillings-and-crowns', anchor: 'fillings' },
  { q: 'A tooth has broken or cracked', to: 'urgent-dental-concerns', anchor: 'broken-tooth' },
  { q: "I've been told I need a root canal", to: 'root-canal-and-extraction', anchor: 'root-canal-care' },
  { q: "I have a gap where a tooth used to be", to: 'replacing-a-missing-tooth', anchor: 'comparing-options' },
  { q: 'I have toothache or swelling', to: 'urgent-dental-concerns', anchor: 'urgent-dental-concerns' },
  { q: "I'd like straighter or lighter teeth", to: 'orthodontics-and-aligners', anchor: 'orthodontics-and-aligners' },
];

export const carePages = [
  {
    slug: 'checkups-and-cleaning',
    title: 'Check-ups and cleaning',
    summary: 'What an oral health review looks at, when X-rays or a professional clean may be suggested, and why the right interval between visits differs from person to person.',
    guides: ['how-often-dental-check-up'],
    related: ['gum-care', 'childrens-dentistry', 'fillings-and-crowns'],
    sources: ['nice-cg19', 'nhs-checkups', 'nhs-treatments', 'nhs-mouth-ulcers'],
    topics: [{
      id: 'checkups-and-cleaning',
      name: 'Check-ups and cleaning',
      whatItIs: `<p>An oral health review, usually called a check-up, is a careful look at your teeth, gums and the soft tissues of your mouth, together with a conversation about your general health, any medicines you take and anything you have noticed since your last visit.</p>`,
      why: `<p>Some people come because it has been a while. Others have noticed something that feels different, or simply want to keep small problems small. A check-up is also a sensible place to start if you aren't sure what kind of care you need.</p>`,
      assessment: `<p>A dentist typically looks at each tooth and at any existing fillings or crowns, checks the gums for bleeding, and examines the tongue, cheeks, palate and floor of the mouth. X-rays are not automatic: they are taken when the dentist judges that they will show something useful, such as decay between teeth or the condition of bone and roots.</p>`,
      approaches: `<p>Afterwards the dentist explains what they found and what, if anything, needs attention. Depending on clinical need, that might be a professional clean to remove hardened deposits (tartar), advice on brushing and cleaning between the teeth, or a separate appointment for treatment. A professional clean is not automatically part of every examination.</p>
<p>The dentist should also suggest when to come back. UK guidance from NICE says this interval should be set for each person according to their oral health and risk: from three months for someone who needs closer monitoring, up to two years for an adult whose mouth has stayed healthy, and no longer than one year for children. Six months is not a universal rule.</p>`,
      ask: ['What did you find, and does anything need attention now?', 'Do I need X-rays today? What would they show?', 'Would a professional clean help me, and is it part of this visit?', 'When should I come back, and why that interval?', 'What one change at home would make the most difference?'],
      limitation: `A check-up can only assess what is visible and what your history and any X-rays show. If something changes between visits, such as pain, swelling, or a mouth ulcer that hasn't healed after three weeks, seek advice rather than waiting for your next review.`,
    }],
  },
  {
    slug: 'gum-care',
    title: 'Gum care',
    summary: 'Why gums bleed or swell, the difference between inflamed gums and more advanced gum disease, and what care usually involves.',
    guides: ['how-often-dental-check-up'],
    related: ['checkups-and-cleaning', 'urgent-dental-concerns', 'replacing-a-missing-tooth'],
    sources: ['nhs-gum', 'nhs-treatments'],
    topics: [{
      id: 'gum-care',
      name: 'Gum care',
      whatItIs: `<p>Gum problems usually begin when plaque, the soft film of bacteria that forms on teeth every day, isn't fully cleaned away. In the early stage the gums become inflamed: they can look red or puffy and bleed when you brush. This is often called gingivitis.</p>
<p>If the inflammation continues, it can spread to the tissues and bone that hold the teeth in place. This more advanced stage, periodontitis, can cause the gums to shrink back and, over time, teeth to loosen.</p>`,
      why: `<p>People usually ask about their gums because they notice bleeding when brushing or cleaning between their teeth, gums that are swollen or sore, gums that seem to be receding, bad breath that doesn't go away, or a tooth that feels looser than it did.</p>`,
      assessment: `<p>A dentist looks at the colour and shape of the gums, checks where they bleed, and may gently measure the small space between each tooth and the gum. X-rays can show the level of bone around the teeth. Your medical history matters too, because smoking, diabetes and some medicines can affect gum health.</p>`,
      approaches: `<p>Care depends on what is found. For many people it starts with practical guidance: brushing twice a day with a fluoride toothpaste and cleaning between the teeth every day with floss or small interdental brushes, chosen to fit the gaps in your mouth. A professional clean removes hardened deposits that a toothbrush can't.</p>
<p>Where the disease is more advanced, care may involve deeper cleaning below the gum line, closer monitoring and, in some cases, referral for specialist assessment. Early inflammation can often settle with consistent cleaning and professional care. Damage from advanced gum disease is usually managed and stabilised rather than undone, which is one reason earlier assessment is worthwhile.</p>`,
      ask: ['Is this early inflammation, or something more advanced?', 'Which way of cleaning between my teeth suits my mouth?', 'Would a professional clean help, and how often might I need one?', 'Do any of my health conditions or medicines affect my gums?', 'How will we know whether things are improving?'],
      limitation: `Bleeding gums are common, but they aren't something to ignore. Seek prompt dental advice if your gums become very swollen or painful, a tooth becomes loose, or you notice a lump, patch or ulcer in your mouth that doesn't heal.`,
    }],
  },
  {
    slug: 'childrens-dentistry',
    title: "Children's dentistry",
    summary: 'Age-appropriate checks, prevention, brushing and diet guidance, and ways to help a child feel prepared for a visit.',
    guides: ['how-often-dental-check-up'],
    related: ['checkups-and-cleaning', 'fillings-and-crowns', 'urgent-dental-concerns'],
    sources: ['nhs-children', 'nice-cg19'],
    topics: [{
      id: 'childrens-dentistry',
      name: "Children's dentistry",
      whatItIs: `<p>Dental care for children is mostly about prevention and confidence: checking teeth as they develop, giving parents clear advice, dealing early with anything that needs attention, and helping a child become comfortable with visiting a dentist.</p>`,
      why: `<p>Parents often ask when a first visit should be, how much toothpaste to use, whether drinks and snacks are affecting their child's teeth, what to do about a tooth that looks discoloured, or how to help a child who is nervous.</p>`,
      assessment: `<p>A dentist looks at how the teeth and gums are developing and how baby and adult teeth are coming through, and talks with the parent or carer about brushing, drinks and snacks. For a young child, much of an early visit may simply be getting used to the chair, the light and the person looking after them.</p>`,
      approaches: `<p>Advice commonly covers brushing twice a day with a fluoride toothpaste in an amount suited to the child's age (a smear for the youngest children, a pea-sized amount from about three), helping or supervising brushing until a child can do it well, and keeping sugary food and drinks to fewer occasions.</p>
<p>Depending on the child's needs, a dentist may discuss preventive measures such as fluoride varnish, or sealants that protect the grooves of the back teeth. UK guidance suggests a first dental visit when the first teeth appear, or before a child's first birthday.</p>`,
      extra: { heading: 'Helping a child feel prepared', html: `<p>Keep explanations simple and positive: the dentist will count and look at their teeth. Avoid words that suggest pain. Reading a picture book about a dental visit, or taking turns to "count teeth" at home, can make the real visit feel familiar. Let the dentist know beforehand if your child is anxious or has particular needs.</p>` },
      ask: ['How much toothpaste should my child use, and what strength?', 'How can I help with brushing at this age?', 'Are there drinks or snacks we should change?', 'Would fluoride varnish or sealants help my child?', 'How can I prepare my child for the visit?'],
      limitation: `Whether the practice sees children, and whether any clinician has a particular focus on children's dentistry, has not been confirmed. This page describes general care, not a specific service.`,
    }],
  },
  {
    slug: 'fillings-and-crowns',
    title: 'Fillings and crowns',
    summary: 'How a dentist decides between repairing a tooth with a filling and protecting it with a crown, and what each may involve.',
    guides: ['what-happens-root-canal-treatment'],
    related: ['root-canal-and-extraction', 'checkups-and-cleaning', 'whitening'],
    sources: ['nhs-treatments'],
    intro: `<p>When a tooth is decayed or damaged, the question is how best to restore it. Smaller problems can often be repaired with a filling. When much of the tooth is missing or weakened, a crown may protect it better. The two are described together here because a dentist often weighs one against the other.</p>`,
    topics: [
      {
        id: 'fillings',
        short: 'Repairing a tooth where decay or a small area of damage has created a cavity, while keeping as much healthy tooth as possible.',
        name: 'Fillings',
        whatItIs: `<p>A filling repairs a tooth where decay or a small area of damage has created a cavity. The damaged part is removed and the space is restored with a filling material, keeping as much healthy tooth as possible.</p>`,
        why: `<p>People ask about fillings when decay has been found at a check-up, when a tooth has become sensitive to sweet or cold things, when food keeps catching in one spot, or when an older filling has chipped or worn.</p>`,
        assessment: `<p>The dentist looks at the size and position of the cavity, how much sound tooth remains, and whether the nerve might be affected. X-rays can show decay between teeth or beneath existing fillings.</p>`,
        approaches: `<p>Filling materials include tooth-coloured composite and amalgam. The dentist chooses and explains the options based on the size and position of the cavity and the forces the tooth takes when you bite. If a large part of the tooth is missing or weakened, a filling alone may not be the best choice, and a crown or another restoration may be discussed.</p>
<p>The cause matters as much as the repair. How often sugary food and drink are taken, cleaning habits and fluoride use all affect whether new decay develops, so a good plan addresses both.</p>`,
        ask: ['How large is the cavity, and is the nerve at risk?', 'Which filling materials are suitable here, and why?', 'Is a filling enough, or would another restoration protect the tooth better?', 'What caused this decay, and how can I reduce the risk of more?'],
        limitation: `Not every cavity can be restored with a filling, and a filled tooth can still develop new decay around its edges. Regular reviews help catch this early.`,
      },
      {
        id: 'crowns',
        short: 'A cap that covers and protects a tooth that is substantially damaged or weakened, or has had root canal treatment.',
        name: 'Crowns',
        whatItIs: `<p>A crown is a cap that covers a tooth completely. It is usually considered when a tooth has been substantially damaged or weakened, for example by a fracture or a very large filling, or after root canal treatment. Crowns are also used in some other restorative situations, such as supporting a bridge.</p>`,
        why: `<p>People ask about crowns when a tooth has broken, when a large filling keeps failing, after root canal treatment, or when a tooth's shape or colour has changed significantly.</p>`,
        assessment: `<p>The dentist looks at how much sound tooth remains, the health of the nerve and gum, and how your teeth meet when you bite. The aim is to find the option that fits the condition of the tooth: a filling, a crown, removal, or another approach.</p>`,
        approaches: `<p>Fitting a crown typically involves shaping the tooth so the crown can sit over it, taking an impression or scan, and fitting the finished crown, sometimes with a temporary crown in between. Crowns can be made from porcelain, metal or combinations of materials, each with trade-offs in strength and appearance.</p>
<p>The number of visits, and how long a crown lasts, depend on the tooth, the material chosen and how it is looked after.</p>`,
        ask: ['Why do you recommend a crown rather than a filling?', 'How much of my tooth will need to be shaped?', 'Which materials are suitable, and what are the trade-offs?', 'How should I care for the crowned tooth, and what signs would mean a problem?'],
        limitation: `A crown protects a tooth but doesn't make it immune to decay or gum problems at its edges, and it can't save a tooth with too little sound structure left. No fixed lifespan can be promised.`,
      },
    ],
  },
  {
    slug: 'root-canal-and-extraction',
    title: 'Root canal care and extractions',
    summary: 'When a tooth is infected or badly damaged: what saving it with root canal treatment involves, and when removal may be considered instead.',
    guides: ['what-happens-root-canal-treatment', 'toothache-when-to-see-a-dentist'],
    related: ['fillings-and-crowns', 'replacing-a-missing-tooth', 'urgent-dental-concerns'],
    sources: ['nhs-root-canal', 'nhs-treatments', 'nhs-abscess'],
    intro: `<p>When the inside of a tooth is infected or a tooth is badly damaged, there are usually two broad routes: try to save the tooth, often with root canal treatment, or remove it. Which is right depends on a clinical assessment of that tooth and on what matters to you.</p>`,
    topics: [
      {
        id: 'root-canal-care',
        short: 'Treating infection or damage inside a tooth so that the tooth can be kept.',
        name: 'Root canal care',
        whatItIs: `<p>Inside each tooth is soft tissue called the pulp. When the pulp becomes infected or badly damaged, through deep decay, a crack or an abscess for example, root canal treatment aims to remove the infection from inside the tooth, clean and shape the root canals, and seal them so the tooth can be kept.</p>`,
        why: `<p>People ask about it when they have lingering pain with hot or cold, pain when biting, a swelling on the gum, a tooth that has darkened, or when a dentist has seen signs of infection on an X-ray.</p>`,
        assessment: `<p>The dentist examines the tooth, usually takes X-rays, and may carry out simple tests to judge whether the pulp is healthy, inflamed or has died. They also consider whether the tooth can be restored well afterwards, because that decides whether saving it is realistic.</p>`,
        approaches: `<p>Treatment is carried out under local anaesthetic and commonly takes two or more appointments. Afterwards the tooth needs a lasting restoration, and a crown is often recommended if the tooth was badly weakened. It is common for the area to feel sore for a while after treatment.</p>
<p>The main alternative is removing the tooth, which then raises the question of whether, and how, to replace it.</p>`,
        ask: ['Can this tooth be saved, and what are its prospects?', 'How many visits do you expect?', 'Will I need a crown afterwards?', 'What would happen if I chose removal instead?'],
        limitation: `Not every tooth can be saved. Whether root canal treatment is appropriate depends on the tooth, the extent of the infection and how much sound tooth remains.`,
      },
      {
        id: 'extractions',
        short: 'Removing a tooth that cannot be repaired, and planning for the gap it leaves.',
        name: 'Extractions',
        whatItIs: `<p>An extraction is the removal of a tooth. It may be considered when a tooth is too badly damaged or infected to repair, when advanced gum disease has loosened it, when a wisdom tooth keeps causing problems, or occasionally as part of orthodontic planning.</p>`,
        why: `<p>People ask about extraction when a tooth is very painful, broken below the gum, loose, or when they have been told a tooth can't be saved.</p>`,
        assessment: `<p>Before removal, the dentist assesses the tooth and surrounding bone, usually with an X-ray, and reviews your medical history and medicines, as some (blood thinners, for example) need particular care. Where saving the tooth is a realistic alternative, it should be discussed first.</p>`,
        approaches: `<p>Many extractions are carried out under local anaesthetic; more complex cases, such as some wisdom teeth, may be referred. After removal a blood clot forms in the socket, and aftercare advice usually covers protecting that clot, eating on the other side, keeping the area clean and knowing when to seek help.</p>
<p>It is worth talking before the extraction about whether the gap might later be replaced, and how.</p>`,
        ask: ['Is removal the only realistic option, or could the tooth be saved?', 'Is there anything about my health or medicines you need to know first?', 'What aftercare will I need, and what signs mean I should come back?', 'Will the gap affect my bite, and what are the options for replacing it?'],
        limitation: `Removal is permanent. Recovery varies from person to person, and a gap can affect neighbouring teeth and your bite over time.`,
      },
    ],
  },
  {
    slug: 'replacing-a-missing-tooth',
    title: 'Implants and replacing a missing tooth',
    summary: 'How implants, bridges and removable dentures compare as ways to replace a missing tooth, and what suitability depends on.',
    guides: [],
    related: ['root-canal-and-extraction', 'gum-care', 'fillings-and-crowns'],
    sources: ['nhs-treatments', 'ada-implants'],
    intro: `<p>A missing tooth can be replaced in several ways, and sometimes leaving a gap is a reasonable choice. The right option depends on your health, the condition of the neighbouring teeth, gums and bone, what matters to you, and cost. Implants are described in detail below, followed by a comparison with bridges and dentures.</p>`,
    topics: [{
      id: 'implants',
      name: 'Implants',
      whatItIs: `<p>A dental implant is a small fixture, usually titanium, placed in the jawbone to act as a replacement root. Once the bone has healed around it, it can support a crown, a bridge or a denture.</p>`,
      why: `<p>People ask about implants when they have lost a tooth, find a removable denture uncomfortable, or would prefer not to have neighbouring teeth shaped to support a bridge.</p>`,
      assessment: `<p>Suitability depends more on health than on age. Assessment typically looks at general health, the amount and quality of bone, the health of the gums and neighbouring teeth, and anything that can slow healing, such as smoking or some medical conditions. Scans or X-rays are usually needed.</p>`,
      approaches: `<p>Implant treatment is usually staged: the fixture is placed, the bone is given time to bond with it, which can take several months, and the replacement tooth is then fitted. Implants need daily cleaning and regular reviews, because the gum and bone around them can become inflamed, much like around natural teeth.</p>`,
      ask: ['Am I a suitable candidate, and what would the assessment involve?', 'What are the stages, and roughly how long might each take?', 'What are the alternatives in my situation?', 'What long-term maintenance will the implant need?', 'Who would carry out each stage of treatment?'],
      limitation: `Implants involve a surgical procedure and aren't suitable for everyone. This page does not suggest that the practice provides implant treatment or has the clinicians or equipment for it; that has not been confirmed.`,
    }],
    comparison: {
      id: 'comparing-options',
      heading: 'Comparing ways to replace a missing tooth',
      intro: `<p>A high-level comparison to help you prepare questions. It is not a recommendation, and none of these options has been confirmed as available at the practice.</p>`,
      rows: [
        { id: 'implants-compare', name: 'Implant', what: 'A fixture in the jawbone that supports a crown, bridge or denture.', involves: 'A surgical stage, a healing period of several months, then the replacement tooth.', discuss: 'Health, bone and gum suitability; daily cleaning and long-term reviews.' },
        { id: 'bridges', name: 'Bridge', what: 'A fixed replacement tooth held in place by the teeth on either side of the gap.', involves: 'Usually shaping the neighbouring teeth so they can support the bridge.', discuss: 'The condition of the neighbouring teeth; cleaning underneath the bridge.' },
        { id: 'dentures', name: 'Removable denture', what: 'A plate carrying one or more replacement teeth, partial or full, that you take out to clean.', involves: 'Impressions or scans and fitting appointments; adjustments over time.', discuss: 'Comfort and fit, which can change as the gums and bone change; daily care.' },
      ],
      after: `<p><strong>Leaving the gap</strong> is sometimes a reasonable choice, particularly towards the back of the mouth. Ask whether it is likely to affect your bite or the neighbouring teeth over time.</p>`,
    },
  },
  {
    slug: 'orthodontics-and-aligners',
    title: 'Orthodontics and aligners',
    summary: 'How tooth position and bite are assessed, and how fixed braces and clear aligners differ in suitability and upkeep.',
    guides: [],
    related: ['checkups-and-cleaning', 'childrens-dentistry', 'whitening'],
    sources: ['ada-braces', 'nhs-treatments'],
    topics: [{
      id: 'orthodontics-and-aligners',
      name: 'Orthodontics or aligners',
      whatItIs: `<p>Orthodontic treatment moves teeth to improve how they fit together and how they look. It can use fixed braces, with small brackets bonded to the teeth and connected by a wire, or a series of removable clear aligners.</p>`,
      why: `<p>People ask about it because of crowded or crooked teeth, gaps, teeth that stick out, or a bite that doesn't meet comfortably. Parents often ask when a child should first be assessed, as bite problems tend to become noticeable between about six and twelve years of age.</p>`,
      assessment: `<p>Assessment looks at how the teeth and jaws meet, how much space there is, the health of the teeth and gums, and what you hope to change. Records such as photographs, X-rays and impressions or scans are usually taken. Treatment may be provided by a dentist or by an orthodontist, a dentist with specialist training, depending on how complex it is.</p>`,
      approaches: `<p>Fixed braces work continuously and suit a wide range of tooth movements. Clear aligners are removable and less visible, but they only work while they are worn for most of the day, and they aren't suitable for every kind of movement. Both need careful cleaning, and some foods are best avoided with fixed braces.</p>
<p>Treatment commonly lasts one to three years. Afterwards, retainers are needed to hold the teeth in their new positions, often for the long term.</p>`,
      ask: ['What would treatment aim to change, and what would stay the same?', 'Are braces or aligners more suitable for me, and why?', 'Who would provide the treatment, and what is their training?', 'How long might it take, and what does wearing retainers involve afterwards?', 'How do I keep my teeth and gums healthy during treatment?'],
      limitation: `Results depend on the starting position, the treatment plan and wearing appliances and retainers as advised, so no particular result can be guaranteed. The practice has not confirmed that it offers orthodontic treatment or has specialist orthodontic staff.`,
    }],
  },
  {
    slug: 'whitening',
    title: 'Whitening',
    summary: 'What whitening can and cannot change, why an oral health check comes first, and the side effects to ask about.',
    guides: [],
    related: ['checkups-and-cleaning', 'fillings-and-crowns', 'gum-care'],
    sources: ['nhs-whitening'],
    topics: [{
      id: 'whitening',
      name: 'Whitening',
      whatItIs: `<p>Tooth whitening uses a bleaching gel to lighten the colour of natural teeth. It may be carried out in a dental surgery, or at home using custom-made trays supplied by a dental professional.</p>`,
      why: `<p>People ask about whitening when their teeth have become darker or more yellow over time, with age or from tea, coffee or smoking, for example.</p>`,
      assessment: `<p>Before any whitening, a dentist should check that the teeth and gums are healthy, look for decay, gum problems or worn enamel that would need attention first, and consider what is causing the discolouration, because some kinds of staining respond poorly to whitening.</p>`,
      approaches: `<p>Whitening only affects natural tooth surfaces. Crowns, fillings, veneers, dentures and implants do not change colour, so they may look different from the surrounding teeth afterwards and could need replacing to match. Temporary sensitivity to cold or sweet things and gum irritation are recognised side effects. Results vary between people and fade over time.</p>
<p>Rules on who may provide whitening, and for whom, differ between countries. How local requirements apply in Karachi is to be confirmed by the reviewing clinician before this page is published.</p>`,
      ask: ['Is my discolouration likely to respond to whitening?', 'Will my fillings or crowns still match afterwards?', 'What side effects might I notice, and how are they managed?', 'What result is realistic for me, and how long might it last?'],
      limitation: `No particular shade can be promised. Whitening is cosmetic: it doesn't treat decay or gum disease, which should be dealt with first.`,
    }],
  },
  {
    slug: 'urgent-dental-concerns',
    title: 'Urgent dental concerns',
    summary: 'What to do about persistent toothache, swelling, a broken or knocked-out tooth, and the warning signs that need hospital care straight away.',
    guides: ['toothache-when-to-see-a-dentist', 'what-happens-root-canal-treatment'],
    related: ['root-canal-and-extraction', 'fillings-and-crowns', 'gum-care'],
    sources: ['nhs-toothache', 'nhs-abscess', 'nhs-knocked-out', 'nhs-broken'],
    redFlags: true,
    topics: [{
      id: 'urgent-dental-concerns',
      name: 'Urgent dental concerns',
      whatItIs: `<p>Some dental problems need prompt attention even when they aren't emergencies: toothache that won't settle, a swelling in the gum or face, a broken tooth, a lost filling or crown, or an injury to the teeth. This page gives general guidance on what to do and how quickly.</p>`,
      triage: [
        { id: 'toothache', title: 'Toothache that lasts', html: `<p>See a dentist if toothache lasts more than two days, doesn't settle with painkillers, or comes with a high temperature, pain when biting, red gums or a bad taste in your mouth. Until then, soft food, avoiding very hot, cold or sugary things, and a pain reliever that is suitable for you can help.</p>` },
        { id: 'swelling', title: 'Swelling in the gum or face', html: `<p>A painful swelling, especially with a bad taste, fever or swollen glands, can be a sign of a dental abscess. An abscess won't go away on its own and needs dental treatment, usually draining the infection and then treating the tooth, either with root canal treatment or by removing it.</p>` },
        { id: 'broken-tooth', title: 'A chipped, cracked or broken tooth', html: `<p>If a piece has broken off, keep it in milk or saliva and take it with you to a dentist. Avoid chewing on that side. Depending on the damage, a dentist may reattach the fragment, place a filling or crown, or, if the nerve is exposed, discuss root canal treatment.</p>` },
        { id: 'knocked-out-tooth', title: 'A knocked-out adult tooth', html: `<p>Act quickly. Hold the tooth by the white part (the crown) and don't touch the root. If it's dirty, rinse it briefly in milk, saline or saliva, then try to put it back into the socket and bite gently on a clean cloth. If it won't go back, keep it in milk or saliva. See a dentist as soon as possible, ideally within an hour.</p><p><strong>Don't put a baby tooth back in</strong>, as this can damage the adult tooth developing underneath.</p>` },
        { id: 'lost-filling', title: 'A lost filling or crown', html: `<p>Keep the crown if you have it, avoid chewing on that side, and arrange to see a dentist.</p>` },
      ],
      assessment: `<p>A dentist will ask when the problem started and what makes it better or worse, examine the area and often take an X-ray to find the cause before recommending treatment.</p>`,
      ask: ['What is causing the pain or swelling?', 'Does this need treatment now, or can it be planned?', 'What should I do if it gets worse before my next appointment?', 'What are the options for fixing it?'],
      limitation: `The practice has not confirmed whether it offers same-day, urgent or after-hours appointments. Please don't rely on this website to arrange urgent care.`,
    }],
  },
];

export const redFlags = {
  heading: 'Go to a hospital emergency department straight away if you have:',
  items: [
    'difficulty breathing, swallowing or speaking',
    'swelling in your face, mouth or neck that is severe or spreading quickly',
    'swelling around your eye, or changes in your vision',
    'difficulty opening your mouth',
    'a significant injury to your face or head',
  ],
};
