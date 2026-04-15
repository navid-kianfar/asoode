import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFuture(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

async function main() {
  console.log('Seeding database with complex enterprise project data...');

  // ─── CLEAR DATA ──────────────────────────────────────────
  console.log('Clearing old management data...');
  await prisma.taskLabel.deleteMany();
  await prisma.taskMember.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.workPackageTask.deleteMany();
  await prisma.workPackageLabel.deleteMany();
  await prisma.workPackageList.deleteMany();
  await prisma.workPackageMember.deleteMany();
  await prisma.workPackage.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.subProject.deleteMany();
  await prisma.project.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  // Clear messenger/files/devices as requested (even if not seeded later)
  await prisma.conversation.deleteMany();
  await prisma.channelMember.deleteMany();
  await prisma.channel.deleteMany();
  await prisma.fileEntry.deleteMany();
  await prisma.device.deleteMany();

  // ─── USERS ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('123456', 12);
  const teamMembers = [
    { email: 'admin@asoode.com', username: 'admin', firstName: 'Navid', lastName: 'Kianfar', bio: 'CTO & Platform Architect' },
    { email: 'aslan@asoode.com', username: 'aslan', firstName: 'Aslan', lastName: 'Nejad', bio: 'Lead Software Engineer' },
    { email: 'navid@asoode.com', username: 'navid_ux', firstName: 'Navid', lastName: 'Designer', bio: 'Head of Product Design' },
    { email: 'kianfar@asoode.com', username: 'kianfar_infra', firstName: 'Kianfar', lastName: 'Dev', bio: 'Infrastructure & DevOps Lead' },
    { email: 'user@asoode.com', username: 'tester', firstName: 'Test', lastName: 'User', bio: 'Senior QA Engineer' },
  ];

  const userRecords: any[] = [];
  for (const u of teamMembers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { ...u, passwordHash },
      create: { ...u, passwordHash, emailConfirmed: true, phoneConfirmed: true },
    });
    userRecords.push(user);
  }
  const adminId = userRecords[0].id;

  // ─── GROUP & PROJECT ────────────────────────────────────
  const groupId = uuid();
  await prisma.group.create({
    data: {
      id: groupId,
      userId: adminId,
      type: 2, // Organization
      title: 'Asoode Enterprise Solutions',
      description: 'Global infrastructure for enterprise grade project management.',
      premium: true,
    },
  });

  await prisma.groupMember.createMany({
    data: userRecords.map(u => ({
      id: uuid(),
      userId: u.id,
      groupId: groupId,
      access: u.email === 'admin@asoode.com' ? 1 : 4,
    })),
  });

  const projectId = uuid();
  await prisma.project.create({
    data: {
      id: projectId,
      userId: adminId,
      groupId: groupId,
      title: 'Global Nexus ERP v2.0',
      description: 'A comprehensive ERP suite integrating finance, logistics, and customer experience.',
      complex: true,
      premium: true,
    },
  });

  await prisma.projectMember.createMany({
    data: userRecords.map(u => ({
      id: uuid(),
      recordId: u.id,
      projectId: projectId,
      access: u.email === 'admin@asoode.com' ? 1 : 4,
    })),
  });

  // ─── SUB-PROJECTS ───────────────────────────────────────
  const subProjDefs = [
    { key: 'FIN', title: 'Core Finance & Accounting', desc: 'Financial ledgers, tax compliance, and auditing.' },
    { key: 'CX', title: 'Customer Experience Suite', desc: 'Portals, mobile apps, and user interaction layers.' },
    { key: 'LOG', title: 'Logistics & Data Analytics', desc: 'Warehouse management, fleet tracking, and BI.' },
  ];

  const subProjIds: Record<string, string> = {};
  for (const spd of subProjDefs) {
    const spId = uuid();
    subProjIds[spd.key] = spId;
    await prisma.subProject.create({
      data: {
        id: spId,
        userId: adminId,
        projectId: projectId,
        title: spd.title,
        description: spd.desc,
      },
    });
  }

  // ─── WORK PACKAGES (BOARDS) ────────────────────────────
  const wpConfigs = [
    { sp: 'FIN', title: 'Tax Compliance & Audit', color: '#f44336' },
    { sp: 'FIN', title: 'Invoicing & Payments', color: '#e91e63' },
    { sp: 'FIN', title: 'Financial BI', color: '#9c27b0' },
    { sp: 'CX', title: 'Public Portal Shell', color: '#673ab7' },
    { sp: 'CX', title: 'Mobile App Refactor', color: '#3f51b5' },
    { sp: 'CX', title: 'Support & CRM', color: '#2196f3' },
    { sp: 'LOG', title: 'Warehouse Ops (WMS)', color: '#009688' },
    { sp: 'LOG', title: 'Fleet Monitoring', color: '#4caf50' },
    { sp: 'LOG', title: 'Data Engineering', color: '#ff9800' },
  ];

  const wpIds: Record<string, string> = {};
  for (let i = 0; i < wpConfigs.length; i++) {
    const wpId = uuid();
    const cfg = wpConfigs[i];
    wpIds[cfg.title] = wpId;
    await prisma.workPackage.create({
      data: {
        id: wpId,
        userId: adminId,
        projectId: projectId,
        subProjectId: subProjIds[cfg.sp],
        title: cfg.title,
        order: i,
        color: cfg.color,
      },
    });

    await prisma.workPackageMember.createMany({
      data: userRecords.map(u => ({
        id: uuid(),
        recordId: u.id,
        packageId: wpId,
        access: u.email === 'admin@asoode.com' ? 1 : 4,
      })),
    });
  }

  // ─── LABELS ─────────────────────────────────────────────
  const labels = [
    { title: 'Critical', color: '#d32f2f' },
    { title: 'High', color: '#f44336' },
    { title: 'Feature', color: '#2196f3' },
    { title: 'Bug', color: '#e91e63' },
    { title: 'UI/UX', color: '#9c27b0' },
    { title: 'Security', color: '#607d8b' },
    { title: 'Data', color: '#00bcd4' },
    { title: 'Automated', color: '#4caf50' },
  ];

  const wpLabels: Record<string, Record<string, string>> = {};
  for (const wpTitle of Object.keys(wpIds)) {
    wpLabels[wpTitle] = {};
    for (const lbl of labels) {
      const lid = uuid();
      wpLabels[wpTitle][lbl.title] = lid;
      await prisma.workPackageLabel.create({
        data: { id: lid, packageId: wpIds[wpTitle], title: lbl.title, color: lbl.color },
      });
    }
  }

  // ─── LISTS ──────────────────────────────────────────────
  const lists = ['Backlog', 'To Do', 'In Progress', 'In Review', 'Done'];
  const listIds: Record<string, Record<string, string>> = {};

  for (const [wpTitle, wpId] of Object.entries(wpIds)) {
    listIds[wpTitle] = {};
    for (let j = 0; j < lists.length; j++) {
      const lid = uuid();
      listIds[wpTitle][lists[j]] = lid;
      await prisma.workPackageList.create({
        data: { id: lid, packageId: wpId, title: lists[j], order: j },
      });
    }
  }

  // ─── TASK GENERATION ────────────────────────────────────
  const taskPool = [
    // FINANCE - Tax Compliance
    { wp: 'Tax Compliance & Audit', list: 'Done', title: 'VAT Calculation Engine Revamp', labels: ['Critical', 'Data'], assignees: ['aslan@asoode.com'] },
    { wp: 'Tax Compliance & Audit', list: 'In Progress', title: 'Audit Trail Snapshot logic', labels: ['Security'], assignees: ['kianfar@asoode.com'] },
    { wp: 'Tax Compliance & Audit', list: 'To Do', title: 'Monthly Tax Report Export (CSV/PDF)', labels: ['Feature'], assignees: ['tester'] },
    { wp: 'Tax Compliance & Audit', list: 'Backlog', title: 'Integration with EU Vies API', labels: ['Data'], assignees: ['aslan@asoode.com'] },
    { wp: 'Tax Compliance & Audit', list: 'In Review', title: 'Secure Key Rotation for Audits', labels: ['Security', 'Critical'], assignees: ['admin@asoode.com'] },
    { wp: 'Tax Compliance & Audit', list: 'Done', title: 'Initial GDPR Audit Compliance Check', labels: ['Automated'], assignees: ['tester'] },
    { wp: 'Tax Compliance & Audit', list: 'To Do', title: 'Implement JWT session for auditors', labels: ['Security'], assignees: ['kianfar@asoode.com'] },

    // FINANCE - Invoicing
    { wp: 'Invoicing & Payments', list: 'In Progress', title: 'Stripe Connect Onboarding Flow', labels: ['Feature', 'UI/UX'], assignees: ['navid_ux', 'aslan@asoode.com'] },
    { wp: 'Invoicing & Payments', list: 'Done', title: 'PDF Invoice Template Generation', labels: ['Feature'], assignees: ['navid_ux'] },
    { wp: 'Invoicing & Payments', list: 'Backlog', title: 'Crypto Payment Support (L2 Bitcoin)', labels: ['Feature', 'High'], assignees: ['admin@asoode.com'] },
    { wp: 'Invoicing & Payments', list: 'To Do', title: 'Fix: Decimal rounding in multi-currency', labels: ['Bug', 'Critical'], assignees: ['aslan@asoode.com'] },
    { wp: 'Invoicing & Payments', list: 'In Review', title: 'Webhook handler for failed subs', labels: ['Bug'], assignees: ['tester'] },
    { wp: 'Invoicing & Payments', list: 'Done', title: 'Automated dunning emails for arrears', labels: ['Automated'], assignees: ['admin@asoode.com'] },
    { wp: 'Invoicing & Payments', list: 'In Progress', title: 'Ledger correction UI for admins', labels: ['UI/UX'], assignees: ['navid_ux'] },

    // FINANCE - BI
    { wp: 'Financial BI', list: 'To Do', title: 'Real-time Profit/Loss Dashboard', labels: ['Feature', 'UI/UX'], assignees: ['navid_ux'] },
    { wp: 'Financial BI', list: 'Backlog', title: 'Predictive Cashflow Modeling using H2O.ai', labels: ['Data', 'Feature'], assignees: ['admin@asoode.com'] },
    { wp: 'Financial BI', list: 'In Progress', title: 'Cube.js implementation for caching', labels: ['Data', 'High'], assignees: ['kianfar@asoode.com'] },
    { wp: 'Financial BI', list: 'Done', title: 'Fix: Database lock on heavy report gen', labels: ['Bug', 'Critical'], assignees: ['aslan@asoode.com'] },

    // CX - Public Portal
    { wp: 'Public Portal Shell', list: 'In Progress', title: 'Next.js 14 App Router Migration', labels: ['Feature', 'High'], assignees: ['aslan@asoode.com'] },
    { wp: 'Public Portal Shell', list: 'To Do', title: 'SEO Metadata dynamic injection', labels: ['Feature'], assignees: ['navid_ux'] },
    { wp: 'Public Portal Shell', list: 'Done', title: 'Landing Page Accessibility Audit (WCAG 2.1)', labels: ['UI/UX', 'Automated'], assignees: ['tester'] },
    { wp: 'Public Portal Shell', list: 'In Review', title: 'CSS variable cleanup for Dark Mode', labels: ['UI/UX'], assignees: ['navid_ux'] },
    { wp: 'Public Portal Shell', list: 'Backlog', title: 'PWA support for portal users', labels: ['Feature'], assignees: ['aslan@asoode.com'] },

    // CX - Mobile
    { wp: 'Mobile App Refactor', list: 'In Progress', title: 'ReactNative Gesture Handler Upgrade', labels: ['High', 'Bug'], assignees: ['aslan@asoode.com'] },
    { wp: 'Mobile App Refactor', list: 'To Do', title: 'Push Notification Badge logic (iOS)', labels: ['Feature'], assignees: ['kianfar@asoode.com'] },
    { wp: 'Mobile App Refactor', list: 'Backlog', title: 'FaceID/Biometric Authentication', labels: ['Security', 'Feature'], assignees: ['admin@asoode.com'] },
    { wp: 'Mobile App Refactor', list: 'In Review', title: 'Fix: Screen flicker on transition', labels: ['Bug', 'UI/UX'], assignees: ['tester'] },
    { wp: 'Mobile App Refactor', list: 'Done', title: 'Asset optimization for splash screens', labels: ['UI/UX'], assignees: ['navid_ux'] },

    // CX - Support
    { wp: 'Support & CRM', list: 'In Progress', title: 'Zendesk API Synchronization', labels: ['Feature'], assignees: ['aslan@asoode.com'] },
    { wp: 'Support & CRM', list: 'To Do', title: 'Chatbot Intent Mapping (Dialogflow)', labels: ['Data', 'Feature'], assignees: ['admin@asoode.com'] },
    { wp: 'Support & CRM', list: 'Done', title: 'Fix: Ticket assignment race condition', labels: ['Bug', 'Critical'], assignees: ['kianfar@asoode.com'] },
    { wp: 'Support & CRM', list: 'In Review', title: 'Customer Feedback Sentiment Analysis', labels: ['Data', 'Automated'], assignees: ['tester'] },

    // LOGISTICS - WMS
    { wp: 'Warehouse Ops (WMS)', list: 'In Progress', title: 'Barcode Scanner driver integration', labels: ['Feature', 'High'], assignees: ['aslan@asoode.com'] },
    { wp: 'Warehouse Ops (WMS)', list: 'To Do', title: 'Zone-based stock placement logic', labels: ['Feature'], assignees: ['admin@asoode.com'] },
    { wp: 'Warehouse Ops (WMS)', list: 'Done', title: 'Inventory Sync with Shopify Store', labels: ['Automated'], assignees: ['kianfar@asoode.com'] },
    { wp: 'Warehouse Ops (WMS)', list: 'Backlog', title: 'Drone-based stock picking research', labels: ['Feature'], assignees: ['navid_ux'] },
    { wp: 'Warehouse Ops (WMS)', list: 'In Review', title: 'Fix: OOM on large inventory CSV import', labels: ['Bug', 'Critical'], assignees: ['tester'] },

    // LOGISTICS - Fleet
    { wp: 'Fleet Monitoring', list: 'In Progress', title: 'Real-time GPS Tracking via MQTT', labels: ['Data', 'Critical'], assignees: ['kianfar@asoode.com'] },
    { wp: 'Fleet Monitoring', list: 'To Do', title: 'Fuel Efficiency Reporting Dashboard', labels: ['UI/UX', 'Feature'], assignees: ['navid_ux'] },
    { wp: 'Fleet Monitoring', list: 'Done', title: 'Route Optimization Algorithm (VRP)', labels: ['Data', 'Automated'], assignees: ['aslan@asoode.com'] },
    { wp: 'Fleet Monitoring', list: 'In Review', title: 'Hardware Integration: ELD OBD-II', labels: ['Feature'], assignees: ['admin@asoode.com'] },

    // LOGISTICS - Data
    { wp: 'Data Engineering', list: 'In Progress', title: 'ClickHouse Cluster for Events', labels: ['Data', 'Critical'], assignees: ['kianfar@asoode.com'] },
    { wp: 'Data Engineering', list: 'To Do', title: 'Airflow DAG for nightly syncs', labels: ['Automated'], assignees: ['admin@asoode.com'] },
    { wp: 'Data Engineering', list: 'Backlog', title: 'Kafka Stream Processing for Alerts', labels: ['Data', 'High'], assignees: ['aslan@asoode.com'] },
    { wp: 'Data Engineering', list: 'Done', title: 'Database schema migration script (v8)', labels: ['Critical'], assignees: ['kianfar@asoode.com'] },
  ];

  // Add more generic tasks to reach ~70
  for (let i = 0; i < 25; i++) {
    const wpKeys = Object.keys(wpIds);
    const randWp = wpKeys[Math.floor(Math.random() * wpKeys.length)];
    const randList = lists[Math.floor(Math.random() * lists.length)];
    taskPool.push({
      wp: randWp,
      list: randList,
      title: `Task #${1000 + i}: Ongoing Enterprise Maintenance`,
      labels: ['Automated'],
      assignees: [userRecords[i % 5].email]
    });
  }

  for (let i = 0; i < taskPool.length; i++) {
    const t = taskPool[i];
    const taskId = uuid();
    const wpId = wpIds[t.wp];
    const lid = listIds[t.wp][t.list];
    const isDone = t.list === 'Done';
    const stateMapping: Record<string, number> = { 'Backlog': 1, 'To Do': 1, 'In Progress': 2, 'In Review': 2, 'Done': 3 };

    const assigneeIds = userRecords.filter(m => t.assignees.includes(m.email) || t.assignees.includes(m.username)).map(m => m.id);
    const creatorId = assigneeIds[0] || adminId;

    // Determine subProjectId from work package
    const wp = wpConfigs.find(c => c.title === t.wp);
    const spId = wp ? subProjIds[wp.sp] : null;

    await prisma.workPackageTask.create({
      data: {
        id: taskId,
        userId: creatorId,
        packageId: wpId,
        projectId: projectId,
        subProjectId: spId,
        listId: lid,
        title: t.title,
        description: `Ref: ERP-TASK-${4 + i}. High-level requirements for ${t.title}. Enterprise context included.`,
        state: stateMapping[t.list] || 1,
        doneAt: isDone ? daysAgo(Math.floor(Math.random() * 10)) : null,
        doneUserId: isDone ? creatorId : null,
        dueAt: i % 4 === 0 ? daysAgo(-1) : (i % 3 === 0 ? daysFuture(7) : null),
        createdAt: daysAgo(Math.floor(Math.random() * 30)),
      },
    });

    for (const aid of assigneeIds) {
      await prisma.taskMember.create({ data: { id: uuid(), taskId, recordId: aid, packageId: wpId } });
    }

    for (const lName of t.labels) {
      const labelId = wpLabels[t.wp][lName];
      if (labelId) {
        await prisma.taskLabel.create({ data: { id: uuid(), taskId, labelId, packageId: wpId } });
      }
    }

    if (i % 5 === 0) {
      await prisma.taskComment.create({
        data: {
          id: uuid(),
          taskId,
          userId: userRecords[i % 5].id,
          message: `Update on task: ${t.title}. Blockers cleared. Proceeding with phase 2.`,
        },
      });
    }
  }

  console.log('Seed complete!');
  console.log(`  - 5 team members.`);
  console.log(`  - Project "Global Nexus ERP v2.0" with 3 Sub-Projects.`);
  console.log(`  - 9 work packages initialized.`);
  console.log(`  - ~${taskPool.length} specialized tasks seeded.`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
