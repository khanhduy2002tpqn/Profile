import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { ImportController } from './import.controller';
import { StudentModule } from '../student/student.module';
import { StorageModule } from '../storage/storage.module';

@Module({
  imports: [StudentModule, StorageModule],
  controllers: [ImportController],
  providers: [ImportService],
})
export class ImportModule {}
