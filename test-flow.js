import mongoose from "mongoose";
import dotenv from "dotenv";
import http from "http";
import app from "./app.js";
import User from "./models/User.js";
import PendingRegistration from "./models/PendingRegistration.js";
import MemberRequest from "./models/MemberRequest.js";

dotenv.config();

const runTest = async () => {
  let server;
  try {
    console.log("=== STARTING E2E WORKFLOW TEST ===");

    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/society");
    console.log("Connected to MongoDB successfully.");

    server = http.createServer(app);
    await new Promise((resolve) => server.listen(5099, resolve));
    const baseUrl = "http://localhost:5099";
    console.log(`Test server running at ${baseUrl}`);

    const testAdminEmail = `admin_test_${Date.now()}@society.com`;
    const testResidentEmail = `resident_test_${Date.now()}@society.com`;
    const testPassword = "Password@123";

    // Clean up old test data if any
    await User.deleteMany({ email: { $in: [testAdminEmail, testResidentEmail] } });
    await PendingRegistration.deleteMany({ email: { $in: [testAdminEmail, testResidentEmail] } });
    await MemberRequest.deleteMany({ email: { $in: [testAdminEmail, testResidentEmail] } });

    // Step 1: Register Admin with Passcode
    console.log("\n[TEST 1] Registering Admin with valid Passcode...");
    const adminRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Super Admin",
        email: testAdminEmail,
        password: testPassword,
        role: "admin",
        adminPasscode: process.env.ADMIN_PASSCODE || "MySociety@2026",
      }),
    });
    const adminRegData = await adminRegRes.json();
    console.log("Admin Register Status:", adminRegRes.status, adminRegData);
    if (adminRegRes.status !== 201 || !adminRegData.token) {
      throw new Error("Admin registration failed!");
    }

    // Step 2: Login as Admin
    console.log("\n[TEST 2] Logging in as Admin...");
    const adminLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testAdminEmail,
        password: testPassword,
      }),
    });
    const adminLoginData = await adminLoginRes.json();
    console.log("Admin Login Status:", adminLoginRes.status, adminLoginData.user);
    if (adminLoginRes.status !== 200 || !adminLoginData.token) {
      throw new Error("Admin login failed!");
    }
    const adminToken = adminLoginData.token;

    // Step 3: Resident Step 1 -> /register (Pending Registration)
    console.log("\n[TEST 3] Resident Step 1: /register (creates PendingRegistration)...");
    const residentRegRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Rahul Sharma",
        email: testResidentEmail,
        password: testPassword,
        role: "resident",
      }),
    });
    const residentRegData = await residentRegRes.json();
    console.log("Resident Register Status:", residentRegRes.status, residentRegData);
    if (residentRegRes.status !== 201 || !residentRegData.registrationId) {
      throw new Error("Resident pending registration failed!");
    }
    const registrationId = residentRegData.registrationId;

    // Step 4: Verify Resident CANNOT login yet (pending approval)
    console.log("\n[TEST 4] Resident Login before approval (should be blocked)...");
    const prematureLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testResidentEmail,
        password: testPassword,
      }),
    });
    const prematureLoginData = await prematureLoginRes.json();
    console.log("Premature login status:", prematureLoginRes.status, prematureLoginData.message);
    if (prematureLoginRes.status !== 403) {
      throw new Error("Premature login was not rejected!");
    }

    // Step 5: Resident Step 2 -> /register/member (MemberRequest)
    console.log("\n[TEST 5] Resident Step 2: /register/member (submits MemberRequest)...");
    const memberReqRes = await fetch(`${baseUrl}/api/member-requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        registrationId,
        email: testResidentEmail,
        buildingName: "Tower A",
        flatNumber: `A-${Math.floor(100 + Math.random() * 900)}`,
        floorNumber: 4,
        flatType: "3BHK",
        ownershipType: "owner",
        moveInDate: "2026-08-01",
        fullName: "Rahul Sharma",
        phone: "9876543210",
        alternatePhone: "9876543211",
        aadhaarNumber: "1234-5678-9012",
        occupation: "Software Engineer",
        companyName: "Google",
        familyMembers: [
          {
            name: "Pooja Sharma",
            relationship: "Spouse",
            gender: "Female",
            phone: "9876543212",
            occupation: "Doctor",
          },
        ],
        emergencyContact: {
          name: "Ramesh Sharma",
          relationship: "Father",
          phone: "9876543213",
        },
      }),
    });
    const memberReqData = await memberReqRes.json();
    console.log("Member Request Status:", memberReqRes.status, memberReqData);
    if (memberReqRes.status !== 201 || !memberReqData.data?._id) {
      throw new Error("MemberRequest submission failed!");
    }
    const requestId = memberReqData.data._id;

    // Step 6: Resident checks Request Status
    console.log("\n[TEST 6] Resident checks request status...");
    const statusRes = await fetch(`${baseUrl}/api/member-requests/${requestId}`);
    const statusData = await statusRes.json();
    console.log("Status check:", statusRes.status, "Status:", statusData.data?.status);
    if (statusRes.status !== 200 || statusData.data?.status !== "pending") {
      throw new Error("Status check mismatch!");
    }

    // Step 7: Admin views pending requests
    console.log("\n[TEST 7] Admin views pending requests...");
    const adminGetRequestsRes = await fetch(`${baseUrl}/api/member-requests`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const adminGetRequestsData = await adminGetRequestsRes.json();
    console.log("Admin requests count:", adminGetRequestsData.data?.length);
    if (adminGetRequestsRes.status !== 200) {
      throw new Error("Failed to fetch requests as Admin!");
    }

    // Step 8: Admin Approves the request
    console.log("\n[TEST 8] Admin Approves MemberRequest...");
    const approveRes = await fetch(`${baseUrl}/api/member-requests/${requestId}/approve`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    const approveData = await approveRes.json();
    console.log("Approve result:", approveRes.status, approveData);
    if (approveRes.status !== 200) {
      throw new Error("Admin approval failed!");
    }

    // Step 9: Verify MemberRequest and PendingRegistration are marked approved
    const pendingDoc = await PendingRegistration.findById(registrationId);
    console.log("PendingRegistration status in DB:", pendingDoc?.status);
    if (pendingDoc?.status !== "approved") {
      throw new Error("PendingRegistration status was not set to approved!");
    }

    // Step 10: Resident logs in with their credentials
    console.log("\n[TEST 10] Resident Logs in after Approval...");
    const residentLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: testResidentEmail,
        password: testPassword,
      }),
    });
    const residentLoginData = await residentLoginRes.json();
    console.log("Resident Login Status:", residentLoginRes.status, residentLoginData);
    if (residentLoginRes.status !== 200 || !residentLoginData.token) {
      throw new Error("Resident login after approval failed!");
    }

    console.log("\n✨✨✨ ALL E2E WORKFLOW TESTS PASSED SUCCESSFULLY! ✨✨✨");

    // Clean up
    await User.deleteMany({ email: { $in: [testAdminEmail, testResidentEmail] } });
    await PendingRegistration.deleteMany({ email: { $in: [testAdminEmail, testResidentEmail] } });
    await MemberRequest.deleteMany({ email: { $in: [testAdminEmail, testResidentEmail] } });
    server.close();
    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error("\n❌ E2E TEST FAILED:", error);
    if (server) server.close();
    await mongoose.disconnect();
    process.exit(1);
  }
};

runTest();
