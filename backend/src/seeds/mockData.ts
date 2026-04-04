import 'reflect-metadata';
import { AppDataSource } from '../config/database';
import { Role } from '../models/Role';
import { User } from '../models/User';
import { hashPassword } from '../utils/crypto';
import { AluminumProfile, ProfileType } from '../models/aluminium/AluminumProfile';
import { Customer } from '../models/aluminium/Customer';
import { Machine, MachineStatus } from '../models/maintenance/Machine';
import { WorkOrder, WorkOrderType, WorkOrderStatus, WorkOrderPriority } from '../models/maintenance/WorkOrder';
import { MaintenancePlan, MaintenanceFrequency } from '../models/maintenance/MaintenancePlan';
import { Warehouse } from '../models/stock/Warehouse';
import { StorageLocation } from '../models/stock/StorageLocation';

async function seedMockData() {
  try {
    await AppDataSource.initialize();
    console.log('Database connection established');

    const roleRepository = AppDataSource.getRepository(Role);
    const userRepository = AppDataSource.getRepository(User);
    const profileRepository = AppDataSource.getRepository(AluminumProfile);
    const customerRepository = AppDataSource.getRepository(Customer);
    const machineRepository = AppDataSource.getRepository(Machine);
    const workOrderRepository = AppDataSource.getRepository(WorkOrder);
    const maintenancePlanRepository = AppDataSource.getRepository(MaintenancePlan);
    const warehouseRepository = AppDataSource.getRepository(Warehouse);
    const locationRepository = AppDataSource.getRepository(StorageLocation);

    // Get or create roles
    let adminRole = await roleRepository.findOne({ where: { name: 'admin' } });
    if (!adminRole) {
      adminRole = roleRepository.create({
        name: 'admin',
        description: 'Administrator',
        permissions: [{ module: '*', actions: ['*'] }],
        isSystemRole: true,
      });
      await roleRepository.save(adminRole);
    }

    // Create other roles for RBAC testing
    const rolesData = [
      { name: 'rh_responsible', description: 'Responsable RH', permissions: [{ module: 'hr', actions: ['*'] }] },
      { name: 'commercial_responsible', description: 'Responsable Commercial', permissions: [{ module: 'commercial', actions: ['*'] }] },
      { name: 'comptable', description: 'Comptable', permissions: [{ module: 'comptabilite', actions: ['*'] }] },
      { name: 'stock_responsible', description: 'Responsable Stock', permissions: [{ module: 'stock', actions: ['*'] }] },
      { name: 'maintenance_responsible', description: 'Responsable Maintenance', permissions: [{ module: 'maintenance', actions: ['*'] }] },
    ];

    const roleMap: Record<string, Role> = { admin: adminRole };
    for (const roleData of rolesData) {
      let role = await roleRepository.findOne({ where: { name: roleData.name } });
      if (!role) {
        role = roleRepository.create(roleData);
        await roleRepository.save(role);
      }
      roleMap[roleData.name] = role;
    }

    // Create test users for each role
    const testUsers = [
      { email: 'admin@erp-aluminium.local', firstName: 'System', lastName: 'Administrator', role: 'admin', password: 'Admin@12345678!' },
      { email: 'rh@erp-aluminium.local', firstName: 'Marie', lastName: 'Dupont', role: 'rh_responsible', password: 'Rh@12345678!' },
      { email: 'commercial@erp-aluminium.local', firstName: 'Jean', lastName: 'Martin', role: 'commercial_responsible', password: 'Commercial@12345678!' },
      { email: 'comptable@erp-aluminium.local', firstName: 'Sophie', lastName: 'Bernard', role: 'comptable', password: 'Comptable@12345678!' },
      { email: 'stock@erp-aluminium.local', firstName: 'Pierre', lastName: 'Laurent', role: 'stock_responsible', password: 'Stock@12345678!' },
      { email: 'maintenance@erp-aluminium.local', firstName: 'Jacques', lastName: 'Moreau', role: 'maintenance_responsible', password: 'Maintenance@12345678!' },
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
          role: roleMap[userData.role],
          isActive: true,
          mfaEnabled: false,
        });
        await userRepository.save(user);
        console.log(`✓ Created user: ${userData.email} (${userData.role})`);
      }
    }

    // Create Aluminum Profiles
    const existingProfiles = await profileRepository.count();
    if (existingProfiles === 0) {
      const profiles = [
        {
          reference: 'PRO-001',
          name: 'Profilé U 70mm',
          type: ProfileType.CUSTOM,
          length: 70,
          width: 35,
          thickness: 3,
          unitPrice: 25.50,
          weightPerMeter: 1.2,
          isActive: true,
        },
        {
          reference: 'PRO-002',
          name: 'Profilé Carré 50mm',
          type: ProfileType.TUBE,
          length: 50,
          width: 50,
          thickness: 2.5,
          unitPrice: 18.75,
          weightPerMeter: 0.95,
          isActive: true,
        },
        {
          reference: 'PRO-003',
          name: 'Profilé Rond ø40mm',
          type: ProfileType.TUBE,
          length: 40,
          diameter: 40,
          thickness: 2,
          unitPrice: 15.00,
          weightPerMeter: 0.72,
          isActive: true,
        },
        {
          reference: 'PRO-004',
          name: 'Profilé Cornière 30x30',
          type: ProfileType.CORNIERE,
          length: 30,
          width: 30,
          thickness: 3,
          unitPrice: 12.50,
          weightPerMeter: 0.55,
          isActive: true,
        },
        {
          reference: 'PRO-005',
          name: 'Profilé Z 80mm',
          type: ProfileType.CUSTOM,
          length: 80,
          width: 40,
          thickness: 2,
          unitPrice: 22.00,
          weightPerMeter: 1.05,
          isActive: true,
        },
      ];

      await profileRepository.save(profiles);
      console.log(`✓ Created ${profiles.length} aluminum profiles`);
    }

    // Create Customers
    const existingCustomers = await customerRepository.count();
    if (existingCustomers === 0) {
      const customers = [
        {
          code: 'CUST-001',
          companyName: 'Aluminium France SARL',
          email: 'contact@aluminium-france.fr',
          phone: '+33 1 23 45 67 89',
          billingStreet: '123 Rue de la Métallurgie',
          billingCity: 'Paris',
          billingPostalCode: '75001',
          billingCountry: 'France',
          contactName: 'Jean Dupont',
          isActive: true,
        },
        {
          code: 'CUST-002',
          companyName: 'Constructions Métalliques du Sud',
          email: 'info@cms-construction.com',
          phone: '+33 4 91 23 45 67',
          billingStreet: '456 Avenue de l\'Industrie',
          billingCity: 'Marseille',
          billingPostalCode: '13001',
          billingCountry: 'France',
          contactName: 'Marie Martin',
          isActive: true,
        },
        {
          code: 'CUST-003',
          companyName: 'Menuiserie Aluminium Pro',
          email: 'contact@menuiserie-pro.fr',
          phone: '+33 2 40 12 34 56',
          billingStreet: '789 Rue des Artisans',
          billingCity: 'Nantes',
          billingPostalCode: '44000',
          billingCountry: 'France',
          contactName: 'Pierre Durant',
          isActive: true,
        },
      ];

      await customerRepository.save(customers);
      console.log(`✓ Created ${customers.length} customers`);
    }

    // Create Warehouses
    const existingWarehouses = await warehouseRepository.count();
    if (existingWarehouses === 0) {
      const warehouses = [
        {
          code: 'WH-001',
          name: 'Entrepôt Principal',
          address: 'Zone Industrielle, 69001 Lyon',
          contactName: 'Jean Claude',
          contactEmail: 'jc@erp.local',
          contactPhone: '+33 4 78 00 00 00',
          isActive: true,
        },
        {
          code: 'WH-002',
          name: 'Magasin Paris',
          address: '15 Rue de la Garde, 93000 Bobigny',
          contactName: 'Marie Louise',
          contactEmail: 'ml@erp.local',
          contactPhone: '+33 1 48 00 00 00',
          isActive: true,
        },
      ];

      const savedWarehouses = await warehouseRepository.save(warehouses);
      console.log(`✓ Created ${savedWarehouses.length} warehouses`);

      // Create Storage Locations
      const locations = [];
      let locIndex = 1;
      for (const wh of savedWarehouses) {
        const whCode = wh.code.replace('WH-', 'WH');
        for (let i = 1; i <= 5; i++) {
          for (let j = 1; j <= 3; j++) {
            locations.push({
              warehouse: wh,
              zone: 'A',
              rack: `R${i}`,
              aisle: `C${j}`,
              level: 'N1',
              code: `${whCode}-A-R${i}-C${j}`,
              maxWeight: 500,
              maxVolume: 2,
              isActive: true,
            });
            locIndex++;
          }
        }
      }

      await locationRepository.save(locations);
      console.log(`✓ Created ${locations.length} storage locations`);
    }

    // Create Machines
    const existingMachines = await machineRepository.count();
    if (existingMachines === 0) {
      const machines = [
        {
          designation: 'CNC Falès 1',
          brand: 'Falès',
          model: 'CNC-5000',
          serialNumber: 'FL-2020-001',
          workshop: 'Atelier A',
          locationDetails: 'Poste de travail 1',
          status: MachineStatus.ACTIVE,
          operationalHours: 12500,
          acquisitionValue: 85000,
          residualValue: 15000,
          purchaseDate: new Date('2020-01-15'),
          installationDate: new Date('2020-02-01'),
        },
        {
          designation: 'Presse Injecteur 1',
          brand: 'B法',
          model: 'PI-300',
          serialNumber: 'B' + '-2019-001',
          workshop: 'Atelier B',
          locationDetails: 'Zone Injection',
          status: MachineStatus.ACTIVE,
          operationalHours: 18000,
          acquisitionValue: 120000,
          residualValue: 25000,
          purchaseDate: new Date('2019-06-10'),
          installationDate: new Date('2019-07-01'),
        },
        {
          designation: 'Scie Automatique',
          brand: 'MecaCut',
          model: 'SA-2000',
          serialNumber: 'MC-2021-001',
          workshop: 'Atelier A',
          locationDetails: 'Poste de travail 2',
          status: MachineStatus.MAINTENANCE,
          operationalHours: 5000,
          acquisitionValue: 45000,
          residualValue: 10000,
          purchaseDate: new Date('2021-03-20'),
          installationDate: new Date('2021-04-05'),
        },
        {
          designation: 'Machine de Traitement',
          brand: 'SurfaceTech',
          model: 'ST-100',
          serialNumber: 'ST-2018-001',
          workshop: 'Atelier C',
          locationDetails: 'Zone Traitement',
          status: MachineStatus.BROKEN_DOWN,
          operationalHours: 22000,
          acquisitionValue: 95000,
          residualValue: 20000,
          purchaseDate: new Date('2018-09-15'),
          installationDate: new Date('2018-10-01'),
          notes: 'Panne moteur principal - en attente réparation',
        },
      ];

      await machineRepository.save(machines);
      console.log(`✓ Created ${machines.length} machines`);
    }

    // Create Maintenance Plans
    const existingPlans = await maintenancePlanRepository.count();
    if (existingPlans === 0) {
      const machines = await machineRepository.find();
      
      const maintenancePlans = machines.slice(0, 3).map((machine, index) => ({
        machine,
        description: `Plan de maintenance ${index + 1} pour ${machine.designation}`,
        taskType: index === 0 ? 'PREVENTIVE' : index === 1 ? 'CORRECTIVE' : 'PREDICTIVE',
        frequency: index === 0 ? MaintenanceFrequency.MONTHLY : index === 1 ? MaintenanceFrequency.QUARTERLY : MaintenanceFrequency.WEEKLY,
        frequencyDays: index === 0 ? 30 : index === 1 ? 90 : 7,
        estimatedDurationHours: 2 + index,
        nextDueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000),
        isActive: true,
      }));

      await maintenancePlanRepository.save(maintenancePlans);
      console.log(`✓ Created ${maintenancePlans.length} maintenance plans`);
    }

    // Create Work Orders
    const existingWorkOrders = await workOrderRepository.count();
    if (existingWorkOrders === 0) {
      const machines = await machineRepository.find();

      if (machines.length === 0) {
        console.log('⚠ No machines found, skipping work orders creation');
      } else {
        const workOrders: any[] = [];

        // Work order 1
        workOrders.push({
          workOrderNumber: 'WO-2026-0001',
          machineId: machines[0].id,
          type: WorkOrderType.PREVENTIVE,
          status: WorkOrderStatus.CREATED,
          priority: WorkOrderPriority.ROUTINE,
          title: 'Maintenance préventive CNC Falès 1',
          description: 'Vérification générale et graissage des axes',
          scheduledDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          assignedTo: adminUser.id,
          createdBy: adminUser.id,
        });

        // Add more work orders only if we have enough machines
        if (machines.length > 1) {
          workOrders.push({
            workOrderNumber: 'WO-2026-0002',
            machineId: machines[1].id,
            type: WorkOrderType.CORRECTIVE,
            status: WorkOrderStatus.IN_PROGRESS,
            priority: WorkOrderPriority.MAJOR,
            title: 'Réparation Presse Injecteur',
            description: 'Remplacement des joints d\'étanchéité',
            scheduledDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            actualStartDatetime: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            assignedTo: adminUser.id,
            createdBy: adminUser.id,
          });
        }

        if (machines.length > 2) {
          workOrders.push({
            workOrderNumber: 'WO-2026-0003',
            machineId: machines[2].id,
            type: WorkOrderType.CORRECTIVE,
            status: WorkOrderStatus.CREATED,
            priority: WorkOrderPriority.CRITICAL,
            title: 'Réparation Machine de Traitement',
            description: 'Panne moteur principal - diagnostic et réparation',
            scheduledDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
            assignedTo: adminUser.id,
            createdBy: adminUser.id,
          });
        }

        if (machines.length > 3) {
          workOrders.push({
            workOrderNumber: 'WO-2026-0004',
            machineId: machines[3].id,
            type: WorkOrderType.PREVENTIVE,
            status: WorkOrderStatus.COMPLETED,
            priority: WorkOrderPriority.MINOR,
            title: 'Maintenance Scie Automatique',
            description: 'Lame de scie changée',
            scheduledDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            actualStartDatetime: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
            actualEndDatetime: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
            closedAt: new Date(Date.now() - 13 * 24 * 60 * 60 * 1000),
            assignedTo: adminUser.id,
            createdBy: adminUser.id,
            completionNotes: 'Maintenance terminée avec succès',
          });
        }

        await workOrderRepository.save(workOrders);
        console.log(`✓ Created ${workOrders.length} work orders`);
      }
    }

    console.log('\n✅ Mock data seeded successfully!');
    
    await AppDataSource.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed failed:', error);
    await AppDataSource.destroy();
    process.exit(1);
  }
}

seedMockData();
