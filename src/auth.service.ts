import { Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { v4 as uuidv4 } from "uuid"; // ✅ ADD THIS
import { UserRepository } from "../generated/user.repository";

@Injectable()
export class AuthService {
  constructor(
    private readonly repo: UserRepository,
    private readonly jwt: JwtService
  ) {}

  /* ================= REGISTER ================= */

  async register(data: any) {
    if (!data.email || !data.password) {
      throw new UnauthorizedException("Email & password required");
    }

    const hashed = await bcrypt.hash(data.password, 10);

    const user = {
      id: uuidv4(), // ✅ REQUIRED FIX
      ...data,
      password: hashed,
      created_at: new Date(), // ⚠️ better than string
      is_premium: false
    };

    await this.repo.insert_one(user);

    return {
      message: "User registered successfully",
      userId: user.id
    };
  }

  /* ================= LOGIN ================= */

  async login(email: string, password: string) {
    const users = await this.repo.find_by({ email });

    if (!users?.data?.length) {
      throw new UnauthorizedException("Invalid credentials");
    }

    const user = users.data[0];

    const match = await bcrypt.compare(password, user.password);

    if (!match) {
      throw new UnauthorizedException("Wrong password");
    }

    const token = this.jwt.sign({
      sub: user.id, // ✅ best practice
      email: user.email,
      role: user.role
    });

    return {
      message: "Login success",
      access_token: token,
      user
    };
  }
}






// import {
//   Injectable,
//   UnauthorizedException,
// } from "@nestjs/common";

// import { JwtService } from "@nestjs/jwt";

// import * as bcrypt from "bcrypt";

// import { v4 as uuidv4 } from "uuid";

// import { UserRepository } from "../generated/user.repository";

// @Injectable()
// export class AuthService {
//   constructor(
//     private readonly repo: UserRepository,
//     private readonly jwt: JwtService
//   ) {}

//   /* ================= REGISTER ================= */

//   async register(data: any) {
//     if (!data.email || !data.password) {
//       throw new UnauthorizedException(
//         "Email & password required"
//       );
//     }

//     const hashedPassword =
//       await bcrypt.hash(data.password, 10);

//     const user = {
//       id: uuidv4(),

//       created_at: new Date(),

//       name: data.name,

//       email: data.email,

//       phone: data.phone || "",

//       role: data.role || "customer",

//       password: hashedPassword,

//       is_premium: false,
//     };

//     await this.repo.insert_one(user);

//     return {
//       message: "User registered successfully",
//       userId: user.id,
//     };
//   }

//   /* ================= LOGIN ================= */

//   async login(
//     email: string,
//     password: string
//   ) {
//     const users = await this.repo.find_by({
//       email,
//     });

//     if (!users?.data?.length) {
//       throw new UnauthorizedException(
//         "Invalid credentials"
//       );
//     }

//     const user = users.data[0];

//     const isPasswordCorrect =
//       await bcrypt.compare(
//         password,
//         user.password
//       );

//     if (!isPasswordCorrect) {
//       throw new UnauthorizedException(
//         "Wrong password"
//       );
//     }

//     const token = this.jwt.sign({
//       sub: user.id,
//       email: user.email,
//       role: user.role,
//     });

//     return {
//       message: "Login success",

//       access_token: token,

//       user,
//     };
//   }
// }