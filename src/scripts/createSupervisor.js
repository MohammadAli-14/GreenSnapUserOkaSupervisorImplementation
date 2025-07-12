import 'dotenv/config'; // 👈 this loads .env automatically
import User from "../models/User.js";
import { connectDB } from "../lib/db.js";
import bcrypt from "bcryptjs";

const createSupervisor = async () => {
  await connectDB();

  const supervisor = new User({
    username: "GreenSnapSupervisor",
    email: "greensnapsupervisor@gmail.com",
    password: await bcrypt.hash("supervisor123", 10),
    role: "supervisor",
    accountVerified: true,
    profileImage: "https://api.dicebear.com/7.x/avataaars/png?seed=Supervisor"
  });

  await supervisor.save();
  console.log("✅ Supervisor account created!");
  process.exit(0);
};

createSupervisor().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
