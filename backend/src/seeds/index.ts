import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { hashPassword } from '../utils/crypto';

async function seed() {
  try {
    // Initialize database connection
    await AppDataSource.initialize();
    console.log('Database connection established');

    const roleRepository = AppDataSource.getRepository(Role);
    const userRepository = AppDataSource.getRepository(User);

    // Check if roles already exist
    const existingRoles = await roleRepository.find();
    console.log(`Found ${existingRoles.length} existing roles`);

    // Create RBAC roles (if not exists)
    const rolesData = [
      { 
        name: 'admin', 
        description: 'Administrator with full system access', 
        permissions: [{ module: '*', actions: ['*'] }],
        isSystemRole: true 
      },
      { 
        name: 'rh_responsible', 
        description: 'Responsable RH - Human Resources Manager', 
        permissions: [{ module: 'hr', actions: ['*'] }],
        isSystemRole: true 
      },
      { 
        name: 'commercial_responsible', 
        description: 'Responsable Commercial - Sales Manager', 
        permissions: [{ module: 'commercial', actions: ['*'] }],
        isSystemRole: true 
      },
      { 
        name: 'comptable', 
        description: 'Comptable - Accountant', 
        permissions: [{ module: 'comptabilite', actions: ['*'] }],
        isSystemRole: true 
      },
      { 
        name: 'stock_responsible', 
        description: 'Responsable Stock - Stock Manager', 
        permissions: [{ module: 'stock', actions: ['*'] }],
        isSystemRole: true 
      },
      { 
        name: 'maintenance_responsible', 
        description: 'Responsable Maintenance - Maintenance Manager', 
        permissions: [{ module: 'maintenance', actions: ['*'] }],
        isSystemRole: true 
      },
    ];

    const roleMap: Record<string, Role> = {};
    for (const roleData of rolesData) {
      let role = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = roleRepository.create(roleData);
        await roleRepository.save(role);
        console.log(`✓ Created role: ${roleData.name}`);
      } else {
        console.log(`✓ Role already exists: ${roleData.name}`);
      }
      roleMap[roleData.name] = role;
    }

    // Create test users for each role
    const testUsers = [
      { email: 'admin@erp-aluminium.local', firstName: 'System', lastName: 'Administrator', roleName: 'admin', password: 'Admin@12345678!' },
      { email: 'rh@erp-aluminium.local', firstName: 'Marie', lastName: 'Dupont', roleName: 'rh_responsible', password: 'Rh@12345678!' },
      { email: 'commercial@erp-aluminium.local', firstName: 'Jean', lastName: 'Martin', roleName: 'commercial_responsible', password: 'Commercial@12345678!' },
      { email: 'comptable@erp-aluminium.local', firstName: 'Sophie', lastName: 'Bernard', roleName: 'comptable', password: 'Comptable@12345678!' },
      { email: 'stock@erp-aluminium.local', firstName: 'Pierre', lastName: 'Laurent', roleName: 'stock_responsible', password: 'Stock@12345678!' },
      { email: 'maintenance@erp-aluminium.local', firstName: 'Jacques', lastName: 'Moreau', roleName: 'maintenance_responsible', password: 'Maintenance@12345678!' },
    ];

    for (const userData of testUsers) {
      let existingUser = await userRepository.findOne({ where: { email: userData.email } });
      if (!existingUser) {
        const passwordHash = await hashPassword(userData.password);
        const user = userRepository.create({
          email: userData.email,
          passwordHash,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: roleMap[userData.roleName],
          isActive: true,
          mfaEnabled: false,
        });
        await userRepository.save(user);
        console.log(`✓ Created user: ${userData.email} (${userData.roleName})`);
      } else {
        console.log(`✓ User already exists: ${userData.email}`);
      }
    }

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📋 Login credentials for testing RBAC:');
    console.log('─'.repeat(50));
    console.log('| Role                    | Email                        | Password         |');
    console.log('─'.repeat(50));
    console.log('| ADMIN                   | admin@erp-aluminium.local   | Admin@12345678!  |');
    console.log('| RH_RESPONSIBLE          | rh@erp-aluminium.local     | Rh@12345678!    |');
    console.log('| COMMERCIAL_RESPONSIBLE  | commercial@erp-aluminium.local | Commercial@12345678! |');
    console.log('| COMPTABLE               | comptable@erp-aluminium.local | Comptable@12345678! |');
    console.log('| STOCK_RESPONSIBLE       | stock@erp-aluminium.local  | Stock@12345678! |');
    console.log('| MAINTENANCE_RESPONSIBLE | maintenance@erp-aluminium.local | Maintenance@12345678! |');
    console.log('─'.repeat(50));

    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seed();