// src/user/user.service.ts
import { Injectable } from "@nestjs/common";
import { CreateAdminDto } from "src/auth/dto/create-user.dto";
import { AccountStatus } from "src/user/dto/verification-dto";
import { UserRoles } from "src/user/enums/role.enum";
import { UserService } from "src/user/user.service";
import { argon2hash } from "src/utils/hashes/argon2";
import { DataSource } from "typeorm";

@Injectable()
export class SeederService {
  constructor(
    private readonly _userService: UserService,
    private readonly _dataSource: DataSource
    // private readonly settingService: SettingsService,
    // @InjectRepository(Setting) private _settingModel: Repository<Setting>
  ) {}

  async seedAdminUser() {
    const adminEmail = "admin@petAttix.com"; // Use a valid email
    const adminPassword = "1qaAzxsw2@";
    const existingAdmin = await this._userService.getUserByEmail("admin@petAttix.com");

    if (!existingAdmin) {
      const adminDto: CreateAdminDto = {
        first_name: "Mr.",
        last_name: "Admin",
        phone: "+8801837352979",
        email: adminEmail,
        password: adminPassword,
        roles: [UserRoles.ADMIN],
      };

      await this._userService.createSuperAdmin(adminDto); // Assuming create method is in your UserService
      console.log("Admin user created successfully!");
    } else {
      console.log("Admin user already exists.");
    }
  }

  async seedFakeUsers() {
    const queryRunner = this._dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const TOTAL_USERS = 20;
    const SHARED_PASSWORD = "Password123!"; // Meets your DTO requirements

    try {
      // this.logger.log(`Starting seed: Generating ${TOTAL_USERS} users...`);

      const hashedPassword = await argon2hash(SHARED_PASSWORD);

      for (let i = 1; i <= TOTAL_USERS; i++) {
        const firstName = `Fake`;
        const lastName = `User${i}`;
        const email = `testuser${i}@harscrape.com`;
        const phone = `123456789${i.toString().padStart(2, "0")}`;

        // 1. Insert User
        const userResult = await queryRunner.manager
          .createQueryBuilder()
          .insert()
          .into("users") // Ensure this matches your table name
          .values({
            first_name: firstName,
            last_name: lastName,
            email: email,
            phone: phone,
            password: hashedPassword,
            status: AccountStatus.INACTIVE, // Defaulting to inactive
            roles: ["user"], // Default role
          })
          .returning("id")
          .execute();

        const userId = userResult.raw[0].id;

        // 2. Create Verification Record
        await queryRunner.manager.insert("verifications", {
          user_id: userId,
          status: AccountStatus.INACTIVE,
        });

        // this.logger.debug(`Created: ${email}`);
      }

      await queryRunner.commitTransaction();
      // this.logger.log('Seed completed successfully.');

      return { message: `${TOTAL_USERS} users created with password: ${SHARED_PASSWORD}` };
    } catch (err) {
      // this.logger.error('Seed failed, rolling back...');
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }
  }
  async seedSettings() {
    // const repo = set.getRepository(Setting);

    const seedData = [
      {
        key: "privacy_policy",
        content: `
        **Privacy Policy**
        Effective Date: 12-28-2024
        Vibley ("we," "our," "us") is committed to protecting your privacy. ...
      `,
      },
      {
        key: "about_us",
        content: `
        **About Us**
        Welcome to Vibley!
        At Vibley, we are dedicated to providing a community-focused platform. ...
      `,
      },
      {
        key: "terms_and_condition",
        content: `
        **Terms and Conditions**
        Effective Date: 12-28-2024
        Welcome to Vibley! By using our services, you agree to comply with ...
      `,
      },
    ];

    // for (const item of seedData) {
    //   const exists = await this._settingModel.findOne({ where: { key: item.key } });
    //   if (!exists) {
    //     await this._settingModel.insert(item);
    //     // await setting.save(setting);
    //   }
    // }

    console.log("✅ Settings seeded.");
  }
  // async seedCategories() {
  //   // const repo = set.getRepository(Setting);

  //   const categories: Partial<Category>[] = [
  //     { name: "Dog Supplies", image: "categories/dog-supplies.jpg" },
  //     { name: "Cat Supplies", image: "categories/cat-supplies.jpg" },
  //     { name: "Fish & Aquarium", image: "categories/fish-aquarium.jpg" },
  //     { name: "Bird Supplies", image: "categories/bird-supplies.jpg" },
  //     { name: "Small Animal Supplies", image: "categories/small-animal.jpg" },
  //     // { name: 'Reptile & Amphibian', image: '/images/categories/reptile.jpg' },
  //     // { name: 'Pet Carriers & Crates', image: '/images/categories/carriers-crates.jpg' },
  //     { name: "Bedding & Furniture", image: "categories/bedding.jpg" },
  //     // { name: 'Feeding & Watering', image: '/images/categories/feeding.jpg' },
  //     // { name: 'Collars, Leashes & Tags', image: '/images/categories/collars-leashes.jpg' },
  //     // { name: 'Toys & Entertainment', image: '/images/categories/toys.jpg' },
  //     // { name: 'Grooming & Health', image: '/images/categories/grooming-health.jpg' },
  //     // { name: 'Training & Behavior', image: '/images/categories/training.jpg' },
  //     // { name: 'Clothing & Accessories', image: '/images/categories/clothing.jpg' },
  //     // { name: 'Cleaning & Waste', image: '/images/categories/cleaning-waste.jpg' },
  //     // { name: 'Cages & Habitats', image: '/images/categories/cages-habitats.jpg' },
  //     // { name: 'Travel & Outdoor Gear', image: '/images/categories/travel-outdoor.jpg' },
  //     // { name: 'Miscellaneous', image: '/images/categories/misc.jpg' },
  //   ];
  //   const category = await this._categoryRepository.find({ where: { name: "Dog Supplies" } });
  //   if (category) {
  //     console.log("Categories already exist");
  //   } else {
  //     await this._categoryRepository.insert(categories);
  //   }

  //   // for (const item of seedData) {
  //   //   const exists = await this._settingModel.findOne({ where: { key: item.key } });
  //   //   if (!exists) {
  //   //     await this._settingModel.insert(item);
  //   //     // await setting.save(setting);
  //   //   }
  //   // }

  //   console.log("✅ Settings seeded.");
  // }
}
