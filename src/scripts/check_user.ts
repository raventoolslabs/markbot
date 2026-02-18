
import { userRepository } from '@/infrastructure/db/repositories/user.repository';
import { managerDb } from '@/infrastructure/db/client';

const checkUser = async () => {
    try {
        // Initialize DB if needed, or just use repository which uses managerDb.db
        // managerDb.db is the Kysely instance. 
        // If we need to init:
        // await managerDb.init(); 
        // But repositories likely use it directly. Let's try just calling repository.
        const user = await userRepository.findById('2af6e1b7-abe6-47a2-b17c-101592600b2e');
        console.log('User:', user);
    } catch (error) {
        console.error(error);
    } finally {
        process.exit();
    }
};

checkUser();
