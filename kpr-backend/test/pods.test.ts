import express from "express";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import request from "supertest";
import { MongoMemoryServer } from "mongodb-memory-server";
import { connectDB } from "../src/config/db";
import podRoutes from "../src/routes/pods";
import Pod from "../src/models/Pod";
import User from "../src/models/User";
import Room from "../src/models/Room";
import Notification from "../src/models/Notification";
import PodActivity from "../src/models/PodActivity";

process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";

const app = express();
app.use(express.json());
app.use("/api/pods", podRoutes);

const createToken = (userId: string) => jwt.sign({ id: userId }, process.env.JWT_SECRET!);

describe("Pod marketplace routes", () => {
  let mongoServer: MongoMemoryServer;
  let owner: any;
  let applicant: any;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    await connectDB(mongoServer.getUri());
    owner = await User.create({ name: "Owner", email: "owner@example.com", password: "password" });
    applicant = await User.create({ name: "Applicant", email: "applicant@example.com", password: "password" });
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    await Pod.deleteMany({});
    await Room.deleteMany({});
    await Notification.deleteMany({});
    await PodActivity.deleteMany({});
  });

  const createPod = async () => {
    return Pod.create({
      name: "Market Pod",
      owner: owner._id,
      visibility: "public",
      tags: ["market"],
      roles: [{ title: "Designer", open: true, slots: 1 }]
    });
  };

  it("allows a user to apply", async () => {
    const pod = await createPod();
    const response = await request(app)
      .post(`/api/pods/${pod._id}/apply`)
      .set("Authorization", `Bearer ${createToken(applicant._id.toString())}`)
      .send({ roleName: "Designer", message: "I want in" });

    expect(response.status).toBe(200);
    const updated = await Pod.findById(pod._id);
    expect(updated?.applicants?.length).toBe(1);
    expect(updated?.applicants?.[0].message).toBe("I want in");
  });

  it("lets the owner approve applicants and creates a DM", async () => {
    const pod = await createPod();
    await request(app)
      .post(`/api/pods/${pod._id}/apply`)
      .set("Authorization", `Bearer ${createToken(applicant._id.toString())}`)
      .send({ roleName: "Designer" });

    const applicantEntry = (await Pod.findById(pod._id))?.applicants?.[0];
    const response = await request(app)
      .post(`/api/pods/${pod._id}/applicants/${applicantEntry?._id}/approve`)
      .set("Authorization", `Bearer ${createToken(owner._id.toString())}`)
      .send();

    expect(response.status).toBe(200);
    const updated = await Pod.findById(pod._id);
    expect(updated?.members?.some((member) => member.user.toString() === applicant._id.toString())).toBe(true);
  const dmRoom = await Room.findById(response.body.dmRoomId);
    expect(dmRoom).toBeTruthy();
  });

  it("lets the owner reject applicants", async () => {
    const pod = await createPod();
    await request(app)
      .post(`/api/pods/${pod._id}/apply`)
      .set("Authorization", `Bearer ${createToken(applicant._id.toString())}`)
      .send({ roleName: "Designer" });

    const applicantEntry = (await Pod.findById(pod._id))?.applicants?.[0];
    const response = await request(app)
      .post(`/api/pods/${pod._id}/applicants/${applicantEntry?._id}/reject`)
      .set("Authorization", `Bearer ${createToken(owner._id.toString())}`)
      .send({ reason: "Not a fit" });

    expect(response.status).toBe(200);
    const updated = await Pod.findById(pod._id);
    expect(updated?.applicants?.length).toBe(0);
  });
});
