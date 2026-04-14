import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';

const prisma = new PrismaClient();

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

async function main() {
  console.log('Seeding database...');

  // ─── USERS ──────────────────────────────────────────────
  const passwordHash = await bcrypt.hash('123456', 12);

  const adminId = uuid();
  const userId = uuid();

  await prisma.user.createMany({
    data: [
      {
        id: adminId,
        email: 'admin@asoode.com',
        username: 'admin',
        passwordHash,
        firstName: 'Admin',
        lastName: 'User',
        bio: 'Platform administrator',
        emailConfirmed: true,
        phoneConfirmed: true,
        userType: 0,
      },
      {
        id: userId,
        email: 'user@asoode.com',
        username: 'user',
        passwordHash,
        firstName: 'Test',
        lastName: 'User',
        bio: 'Test user account',
        emailConfirmed: true,
        phoneConfirmed: true,
        userType: 0,
      },
    ],
  });

  // ─── GROUPS ─────────────────────────────────────────────
  const groupIds = { team: uuid(), eng: uuid(), design: uuid() };

  await prisma.group.createMany({
    data: [
      {
        id: groupIds.team,
        userId: adminId,
        type: 2, // Organization
        title: 'Asoode Team',
        description: 'Main organization group',
        premium: true,
      },
      {
        id: groupIds.eng,
        userId: adminId,
        parentId: groupIds.team,
        rootId: groupIds.team,
        type: 7, // Department
        title: 'Engineering',
        description: 'Engineering department',
      },
      {
        id: groupIds.design,
        userId: adminId,
        parentId: groupIds.team,
        rootId: groupIds.team,
        type: 8, // Team
        title: 'Design',
        description: 'Design team',
      },
    ],
  });

  // Add members to groups
  const groupMemberData = [
    { id: uuid(), userId: adminId, groupId: groupIds.team, access: 1 },
    { id: uuid(), userId: userId, groupId: groupIds.team, access: 4 },
    { id: uuid(), userId: adminId, groupId: groupIds.eng, access: 1 },
    { id: uuid(), userId: userId, groupId: groupIds.eng, access: 4 },
    { id: uuid(), userId: adminId, groupId: groupIds.design, access: 1 },
    { id: uuid(), userId: userId, groupId: groupIds.design, access: 4 },
  ];
  await prisma.groupMember.createMany({ data: groupMemberData });

  // ─── PROJECTS ───────────────────────────────────────────
  const projectIds = { platform: uuid(), mobile: uuid(), website: uuid() };

  await prisma.project.createMany({
    data: [
      {
        id: projectIds.platform,
        userId: adminId,
        groupId: groupIds.team,
        title: 'Platform Development',
        description: 'Core platform development project',
        complex: true,
        premium: true,
      },
      {
        id: projectIds.mobile,
        userId: adminId,
        groupId: groupIds.eng,
        title: 'Mobile App',
        description: 'iOS and Android mobile application',
        complex: false,
      },
      {
        id: projectIds.website,
        userId: adminId,
        groupId: groupIds.design,
        title: 'Website Redesign',
        description: 'Marketing website redesign project',
        complex: false,
      },
    ],
  });

  // Add members to projects
  const projectMemberData = [
    { id: uuid(), recordId: adminId, projectId: projectIds.platform, access: 1 },
    { id: uuid(), recordId: userId, projectId: projectIds.platform, access: 4 },
    { id: uuid(), recordId: adminId, projectId: projectIds.mobile, access: 1 },
    { id: uuid(), recordId: userId, projectId: projectIds.mobile, access: 4 },
    { id: uuid(), recordId: adminId, projectId: projectIds.website, access: 1 },
    { id: uuid(), recordId: userId, projectId: projectIds.website, access: 4 },
  ];
  await prisma.projectMember.createMany({ data: projectMemberData });

  // ─── WORK PACKAGES ─────────────────────────────────────
  interface WpDef {
    id: string;
    projectId: string;
    title: string;
    lists: { id: string; title: string; order: number; tasks: { title: string; state: number }[] }[];
  }

  const wpDefs: WpDef[] = [];

  for (const [projKey, projId] of Object.entries(projectIds)) {
    for (let wpIdx = 0; wpIdx < 2; wpIdx++) {
      const wpId = uuid();
      const wpTitle =
        projKey === 'platform'
          ? wpIdx === 0
            ? 'Backend API'
            : 'Frontend UI'
          : projKey === 'mobile'
            ? wpIdx === 0
              ? 'iOS Development'
              : 'Android Development'
            : wpIdx === 0
              ? 'Homepage Design'
              : 'Inner Pages';

      const lists = [
        {
          id: uuid(),
          title: 'To Do',
          order: 0,
          tasks: [
            { title: `Set up ${wpTitle} project structure`, state: 3 },
            { title: `Create ${wpTitle} documentation`, state: 1 },
            { title: `Review ${wpTitle} requirements`, state: 1 },
          ],
        },
        {
          id: uuid(),
          title: 'In Progress',
          order: 1,
          tasks: [
            { title: `Implement ${wpTitle} core features`, state: 2 },
            { title: `Design ${wpTitle} architecture`, state: 2 },
          ],
        },
        {
          id: uuid(),
          title: 'Review',
          order: 2,
          tasks: [
            { title: `Code review for ${wpTitle}`, state: 2 },
            { title: `QA testing for ${wpTitle}`, state: 1 },
          ],
        },
        {
          id: uuid(),
          title: 'Done',
          order: 3,
          tasks: [
            { title: `${wpTitle} initial setup complete`, state: 3 },
            { title: `${wpTitle} environment configured`, state: 3 },
            { title: `${wpTitle} CI/CD pipeline ready`, state: 3 },
          ],
        },
      ];

      wpDefs.push({ id: wpId, projectId: projId, title: wpTitle, lists });
    }
  }

  // Create work packages
  await prisma.workPackage.createMany({
    data: wpDefs.map((wp, i) => ({
      id: wp.id,
      userId: adminId,
      projectId: wp.projectId,
      title: wp.title,
      order: i,
      boardTemplate: 5, // Kanban
    })),
  });

  // Add members to work packages
  const wpMemberData: { id: string; recordId: string; packageId: string; access: number }[] = [];
  for (const wp of wpDefs) {
    wpMemberData.push({ id: uuid(), recordId: adminId, packageId: wp.id, access: 1 });
    wpMemberData.push({ id: uuid(), recordId: userId, packageId: wp.id, access: 4 });
  }
  await prisma.workPackageMember.createMany({ data: wpMemberData });

  // Create labels for each work package
  const labelColors = [
    { color: '#ef5350', title: 'Bug' },
    { color: '#42a5f5', title: 'Feature' },
    { color: '#66bb6a', title: 'Enhancement' },
    { color: '#ffa726', title: 'Urgent' },
    { color: '#ab47bc', title: 'Design' },
  ];

  const labelMap: Record<string, string[]> = {};
  for (const wp of wpDefs) {
    labelMap[wp.id] = [];
    for (const lbl of labelColors) {
      const lblId = uuid();
      labelMap[wp.id].push(lblId);
      await prisma.workPackageLabel.create({
        data: { id: lblId, packageId: wp.id, title: lbl.title, color: lbl.color },
      });
    }
  }

  // Create lists and tasks
  let taskCount = 0;
  for (const wp of wpDefs) {
    for (const list of wp.lists) {
      await prisma.workPackageList.create({
        data: { id: list.id, packageId: wp.id, title: list.title, order: list.order },
      });

      for (let tIdx = 0; tIdx < list.tasks.length; tIdx++) {
        const taskDef = list.tasks[tIdx];
        const taskId = uuid();
        const isDone = taskDef.state === 3;
        taskCount++;

        await prisma.workPackageTask.create({
          data: {
            id: taskId,
            userId: taskCount % 2 === 0 ? adminId : userId,
            packageId: wp.id,
            projectId: wp.projectId,
            listId: list.id,
            title: taskDef.title,
            description: `Description for: ${taskDef.title}`,
            order: tIdx,
            state: taskDef.state,
            doneAt: isDone ? daysAgo(Math.floor(Math.random() * 10)) : null,
            doneUserId: isDone ? adminId : null,
            createdAt: daysAgo(Math.floor(Math.random() * 30)),
          },
        });

        // Assign both users as members to every task
        await prisma.taskMember.createMany({
          data: [
            { id: uuid(), taskId, recordId: adminId, packageId: wp.id },
            { id: uuid(), taskId, recordId: userId, packageId: wp.id },
          ],
        });

        // Assign 1-2 random labels
        const labels = labelMap[wp.id];
        const numLabels = 1 + Math.floor(Math.random() * 2);
        const shuffled = [...labels].sort(() => Math.random() - 0.5);
        for (let l = 0; l < numLabels && l < shuffled.length; l++) {
          await prisma.taskLabel.create({
            data: { id: uuid(), taskId, labelId: shuffled[l], packageId: wp.id },
          });
        }

        // Add a comment to some tasks
        if (taskCount % 3 === 0) {
          await prisma.taskComment.create({
            data: {
              id: uuid(),
              taskId,
              userId: adminId,
              message: `This task looks good. Let's proceed with the implementation.`,
            },
          });
        }
      }
    }
  }

  // ─── MESSENGER CHANNELS ─────────────────────────────────
  const channelId1 = uuid();
  const channelId2 = uuid();

  await prisma.channel.createMany({
    data: [
      { id: channelId1, userId: adminId, type: 1, title: '' },
      { id: channelId2, userId: adminId, type: 2, rootId: projectIds.platform, title: 'Platform Chat' },
    ],
  });

  await prisma.channelMember.createMany({
    data: [
      { id: uuid(), channelId: channelId1, userId: adminId },
      { id: uuid(), channelId: channelId1, userId: userId },
      { id: uuid(), channelId: channelId2, userId: adminId },
      { id: uuid(), channelId: channelId2, userId: userId },
    ],
  });

  // Add some messages
  const messages = [
    { channelId: channelId1, userId: adminId, message: 'Hey, how is the project going?' },
    { channelId: channelId1, userId: userId, message: 'Going well! Almost done with the API.' },
    { channelId: channelId1, userId: adminId, message: 'Great work! Let me know if you need help.' },
    { channelId: channelId2, userId: adminId, message: 'Welcome to the Platform Chat channel.' },
    { channelId: channelId2, userId: userId, message: 'Thanks! Excited to collaborate here.' },
  ];

  for (let i = 0; i < messages.length; i++) {
    await prisma.conversation.create({
      data: {
        id: uuid(),
        ...messages[i],
        type: 1,
        createdAt: daysAgo(messages.length - i),
      },
    });
  }

  // ─── FILE ENTRIES ───────────────────────────────────────
  await prisma.fileEntry.createMany({
    data: [
      { id: uuid(), userId: adminId, name: 'Documents', path: '/Documents/', isFolder: true },
      { id: uuid(), userId: adminId, name: 'Images', path: '/Images/', isFolder: true },
      { id: uuid(), userId: adminId, name: 'project-plan.pdf', path: '/Documents/project-plan.pdf', extension: 'pdf', size: 1048576 },
      { id: uuid(), userId: adminId, name: 'meeting-notes.docx', path: '/Documents/meeting-notes.docx', extension: 'docx', size: 524288 },
      { id: uuid(), userId: userId, name: 'My Files', path: '/My Files/', isFolder: true },
      { id: uuid(), userId: userId, name: 'report.xlsx', path: '/My Files/report.xlsx', extension: 'xlsx', size: 262144 },
    ],
  });

  // ─── DEVICES ────────────────────────────────────────────
  await prisma.device.createMany({
    data: [
      { id: uuid(), userId: adminId, title: 'MacBook Pro', os: 'macOS' },
      { id: uuid(), userId: adminId, title: 'iPhone 15', os: 'iOS' },
      { id: uuid(), userId: userId, title: 'Windows Desktop', os: 'Windows' },
    ],
  });

  console.log('Seed complete!');
  console.log(`  - 2 users (admin@asoode.com / user@asoode.com, password: 123456)`);
  console.log(`  - 3 groups`);
  console.log(`  - 3 projects with 6 work packages`);
  console.log(`  - ${taskCount} tasks across all work packages`);
  console.log(`  - 2 messenger channels with sample messages`);
  console.log(`  - Sample file entries and devices`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
