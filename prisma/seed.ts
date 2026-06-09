import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPass = await bcrypt.hash("admin123", 10);
  const liveryPass = await bcrypt.hash("livery123", 10);

  // --- Admin user ---
  await prisma.user.upsert({
    where: { email: "admin@yard.test" },
    update: {},
    create: {
      email: "admin@yard.test",
      name: "Yard Admin",
      role: "ADMIN",
      passwordHash: adminPass,
    },
  });

  // --- Barns & boxes ---
  const barnA = await prisma.barn.upsert({
    where: { id: "seed-barn-a" },
    update: {},
    create: { id: "seed-barn-a", name: "Main Barn", description: "Original stable block" },
  });
  const barnB = await prisma.barn.upsert({
    where: { id: "seed-barn-b" },
    update: {},
    create: { id: "seed-barn-b", name: "American Barn", description: "Newer indoor barn" },
  });

  const boxes: { id: string; barnId: string; number: string }[] = [];
  for (let i = 1; i <= 6; i++) {
    boxes.push({ id: `seed-box-a-${i}`, barnId: barnA.id, number: `A${i}` });
  }
  for (let i = 1; i <= 6; i++) {
    boxes.push({ id: `seed-box-b-${i}`, barnId: barnB.id, number: `B${i}` });
  }
  for (const b of boxes) {
    await prisma.box.upsert({
      where: { id: b.id },
      update: {},
      create: b,
    });
  }

  // --- Livery 1 ---
  const livery1 = await prisma.livery.upsert({
    where: { id: "seed-livery-1" },
    update: {},
    create: {
      id: "seed-livery-1",
      name: "Jane Smith",
      contactName: "Jane Smith",
      email: "jane@yard.test",
      phone: "07700 900123",
      addressLine1: "12 Paddock Lane",
      city: "Bristol",
      postcode: "BS1 2AB",
      notes: "Long-standing client.",
    },
  });
  await prisma.user.upsert({
    where: { email: "jane@yard.test" },
    update: {},
    create: {
      email: "jane@yard.test",
      name: "Jane Smith",
      role: "LIVERY",
      passwordHash: liveryPass,
      liveryId: livery1.id,
    },
  });
  await prisma.horse.upsert({
    where: { id: "seed-horse-1" },
    update: {},
    create: {
      id: "seed-horse-1",
      liveryId: livery1.id,
      name: "Thunder",
      age: 9,
      sex: "Gelding",
      height: "16.2hh",
      color: "Bay",
      vetName: "Oakfield Equine Vets",
      vetPhone: "01179 000111",
      emergencyContact: "John Smith",
      emergencyPhone: "07700 900999",
      notes: "Allergic to certain bedding. Box rest if lame.",
      boxId: "seed-box-a-1",
    },
  });
  await prisma.horse.upsert({
    where: { id: "seed-horse-2" },
    update: {},
    create: {
      id: "seed-horse-2",
      liveryId: livery1.id,
      name: "Bella",
      age: 6,
      sex: "Mare",
      height: "15.1hh",
      color: "Chestnut",
      vetName: "Oakfield Equine Vets",
      vetPhone: "01179 000111",
      emergencyContact: "John Smith",
      emergencyPhone: "07700 900999",
      boxId: "seed-box-a-2",
    },
  });

  // --- Livery 2 ---
  const livery2 = await prisma.livery.upsert({
    where: { id: "seed-livery-2" },
    update: {},
    create: {
      id: "seed-livery-2",
      name: "Tom Jones",
      contactName: "Tom Jones",
      email: "tom@yard.test",
      phone: "07700 900456",
      addressLine1: "5 Meadow View",
      city: "Bath",
      postcode: "BA2 3CD",
    },
  });
  await prisma.user.upsert({
    where: { email: "tom@yard.test" },
    update: {},
    create: {
      email: "tom@yard.test",
      name: "Tom Jones",
      role: "LIVERY",
      passwordHash: liveryPass,
      liveryId: livery2.id,
    },
  });
  await prisma.horse.upsert({
    where: { id: "seed-horse-3" },
    update: {},
    create: {
      id: "seed-horse-3",
      liveryId: livery2.id,
      name: "Star",
      age: 12,
      sex: "Gelding",
      height: "14.2hh",
      color: "Grey",
      boxId: "seed-box-b-1",
    },
  });

  // --- Catalog: services & store ---
  const services = [
    { id: "svc-full", name: "Full Livery", description: "Full care daily", price: 25, frequency: "DAILY" },
    { id: "svc-muck", name: "Muck Out", description: "Daily muck out", price: 6, frequency: "DAILY" },
    { id: "svc-turnout", name: "Turn Out / Bring In", description: "Turnout and bring in", price: 5, frequency: "DAILY" },
    { id: "svc-school", name: "Schooling", description: "Schooling session", price: 20, frequency: "WEEKLY" },
  ];
  for (const s of services) {
    await prisma.catalogItem.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, type: "SERVICE", active: true },
    });
  }
  const store = [
    { id: "store-shavings", name: "Shavings Bale", description: "Dust-extracted shavings", price: 8.5 },
    { id: "store-haylage", name: "Haylage Bale", description: "Small haylage bale", price: 6 },
    { id: "store-hardfeed", name: "Hard Feed Sack", description: "20kg conditioning mix", price: 14 },
  ];
  for (const s of store) {
    await prisma.catalogItem.upsert({
      where: { id: s.id },
      update: {},
      create: { ...s, type: "STORE", active: true, frequency: null },
    });
  }

  // --- Arena ---
  await prisma.arena.upsert({
    where: { id: "seed-arena-1" },
    update: {},
    create: { id: "seed-arena-1", name: "Outdoor Arena" },
  });
  await prisma.arena.upsert({
    where: { id: "seed-arena-2" },
    update: {},
    create: { id: "seed-arena-2", name: "Indoor School" },
  });

  // --- Notice board ---
  const admin = await prisma.user.findUnique({ where: { email: "admin@yard.test" } });
  await prisma.notice.upsert({
    where: { id: "seed-notice-1" },
    update: {},
    create: {
      id: "seed-notice-1",
      title: "Welcome to the new yard portal",
      body: "Please keep your horse details up to date and book the arena in advance. Any questions, find me in the office.",
      pinned: true,
      createdById: admin?.id,
    },
  });

  // --- Forums ---
  await prisma.forum.upsert({
    where: { id: "seed-forum-central" },
    update: {},
    create: {
      id: "seed-forum-central",
      name: "General Discussion",
      description: "Open to all liveries",
      isCentral: true,
    },
  });
  const committee = await prisma.forum.upsert({
    where: { id: "seed-forum-committee" },
    update: {},
    create: {
      id: "seed-forum-committee",
      name: "Yard Committee",
      description: "Private group",
      isCentral: false,
    },
  });
  await prisma.forumMember.upsert({
    where: { forumId_liveryId: { forumId: committee.id, liveryId: livery1.id } },
    update: {},
    create: { forumId: committee.id, liveryId: livery1.id },
  });

  // --- Storage spots ---
  await prisma.storageSpot.upsert({
    where: { id: "seed-storage-1" },
    update: {},
    create: { id: "seed-storage-1", label: "Trailer Bay 1", type: "TRAILER", assignedLiveryId: livery1.id },
  });
  await prisma.storageSpot.upsert({
    where: { id: "seed-storage-2" },
    update: {},
    create: { id: "seed-storage-2", label: "Horsebox Bay A", type: "HORSEBOX", assignedLiveryId: livery2.id },
  });
  await prisma.storageSpot.upsert({
    where: { id: "seed-storage-3" },
    update: {},
    create: { id: "seed-storage-3", label: "Trailer Bay 2", type: "TRAILER" },
  });

  console.log("Seed complete. Logins:");
  console.log("  admin@yard.test / admin123 (ADMIN)");
  console.log("  jane@yard.test  / livery123 (LIVERY)");
  console.log("  tom@yard.test   / livery123 (LIVERY)");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
