-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: careslot_nha_khoa
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `appointments`
--

DROP TABLE IF EXISTS `appointments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `appointments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `dependent_id` int(11) DEFAULT NULL,
  `patient_name` varchar(255) NOT NULL,
  `patient_phone` varchar(20) NOT NULL,
  `patient_email` varchar(255) DEFAULT NULL,
  `patient_dob` date DEFAULT NULL,
  `appointment_time` datetime NOT NULL,
  `service_id` int(11) DEFAULT NULL,
  `doctor_id` int(11) DEFAULT NULL,
  `status` varchar(50) DEFAULT 'Pending',
  `created_by` varchar(50) DEFAULT NULL,
  `reminder_sent_at` datetime DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `service_id` (`service_id`),
  KEY `doctor_id` (`doctor_id`),
  KEY `dependent_id` (`dependent_id`),
  CONSTRAINT `appointments_ibfk_1` FOREIGN KEY (`service_id`) REFERENCES `services` (`id`),
  CONSTRAINT `appointments_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`),
  CONSTRAINT `appointments_ibfk_3` FOREIGN KEY (`dependent_id`) REFERENCES `dependent_profiles` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `appointments`
--

LOCK TABLES `appointments` WRITE;
/*!40000 ALTER TABLE `appointments` DISABLE KEYS */;
INSERT INTO `appointments` VALUES (6,NULL,NULL,'Nguyen Phuong','0986172542',NULL,'2004-07-30','2025-11-07 01:00:00',2,3,'confirmed',NULL,NULL,'2025-11-05 18:29:08'),(8,NULL,NULL,'Phương','0986172542',NULL,'2004-07-30','2025-11-08 09:00:00',2,11,'confirmed',NULL,NULL,'2025-11-07 06:54:46'),(9,NULL,NULL,'Phương','0986172542',NULL,'2004-07-30','2025-11-08 08:30:00',3,6,'completed',NULL,NULL,'2025-11-07 10:37:00'),(10,NULL,NULL,'Tái khám: Phương','0986172542',NULL,NULL,'2025-11-12 08:00:00',3,6,'confirmed',NULL,NULL,'2025-11-11 18:44:46'),(12,NULL,NULL,'phuong123','0986172542',NULL,'2025-11-09','2025-11-18 10:30:00',1,6,'confirmed',NULL,'2025-11-16 15:19:20','2025-11-15 18:14:07'),(13,NULL,NULL,'Phương','0986172541',NULL,'2008-06-16','2025-11-19 08:00:00',2,6,'confirmed',NULL,NULL,'2025-11-16 08:22:32'),(14,NULL,NULL,'phuong123','0986172542',NULL,'2023-07-19','2025-11-19 12:00:00',3,6,'confirmed',NULL,'2025-11-16 15:48:36','2025-11-16 08:48:16'),(15,NULL,NULL,'phuong123','0986172542',NULL,'2006-07-16','2025-11-22 13:00:00',3,6,'completed',NULL,'2025-11-16 15:51:18','2025-11-16 08:50:56'),(16,NULL,NULL,'Phương','0922227605',NULL,'2006-07-22','2025-11-24 09:00:00',2,6,'completed',NULL,NULL,'2025-11-22 09:43:40'),(17,NULL,NULL,'Nguyen Dinh Nguyen Phuong','0922227605','ndnphuong3007@gmail.com','2004-07-30','2025-11-29 09:30:00',2,6,'confirmed',NULL,'2025-11-24 14:58:02','2025-11-22 10:16:39'),(18,NULL,NULL,'Nhat','0986172548','ndnphuong3001@gmail.com','2004-12-30','2025-11-29 10:00:00',2,6,'cancelled',NULL,NULL,'2025-11-22 10:21:11'),(19,NULL,NULL,'Nguyễn Thị Xuân Mai','0922227606','nguyenthixuanmai09032004@gmail.com','2004-03-09','2025-11-25 08:00:00',2,6,'completed',NULL,'2025-11-24 14:57:42','2025-11-24 07:42:14'),(20,NULL,NULL,'Nguyen Dinh Nguyen Phuong','0986172542','ndnphuong3007@gmail.com','2004-07-30','2025-11-27 13:00:00',1,6,'completed',NULL,'2025-11-24 15:07:22','2025-11-24 08:06:31'),(21,NULL,NULL,'Nguyễn Đình Nguyên Phương','0986172542','ndnphuong3007@gmail.com','2004-07-30','2025-11-28 13:00:00',3,6,'completed',NULL,NULL,'2025-11-24 08:20:35'),(22,NULL,NULL,'Nguyễn Thị Xuân Mai','0922227607','nguyenthixuanmai09032004@gmail.com','2004-03-09','2025-11-26 13:00:00',2,6,'completed',NULL,'2025-11-24 15:24:08','2025-11-24 08:23:46'),(23,NULL,NULL,'Nguyễn Thị Xuân Mai','0922227605',NULL,NULL,'2025-11-25 08:30:00',3,6,'completed','receptionist',NULL,'2025-11-24 08:58:46');
/*!40000 ALTER TABLE `appointments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `clinical_notes`
--

DROP TABLE IF EXISTS `clinical_notes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `clinical_notes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `appointment_id` int(11) NOT NULL,
  `doctor_id` int(11) NOT NULL,
  `patient_user_id` int(11) DEFAULT NULL,
  `diagnosis` text DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `appointment_id` (`appointment_id`),
  KEY `doctor_id` (`doctor_id`),
  CONSTRAINT `clinical_notes_ibfk_1` FOREIGN KEY (`appointment_id`) REFERENCES `appointments` (`id`) ON DELETE CASCADE,
  CONSTRAINT `clinical_notes_ibfk_2` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `clinical_notes`
--

LOCK TABLES `clinical_notes` WRITE;
/*!40000 ALTER TABLE `clinical_notes` DISABLE KEYS */;
INSERT INTO `clinical_notes` VALUES (3,9,6,NULL,'Sâu răng','Sâu răng nặng','2025-11-11 18:45:11'),(4,15,6,NULL,'Trám răng sâu phía trong','Răng sâu cấp 1','2025-11-22 07:07:17');
/*!40000 ALTER TABLE `clinical_notes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `conversations`
--

DROP TABLE IF EXISTS `conversations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `conversations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) DEFAULT NULL,
  `staff_id` int(11) DEFAULT NULL,
  `anonymous_name` varchar(255) DEFAULT NULL,
  `type` enum('doctor','receptionist') NOT NULL,
  `status` enum('pending','active','closed','expired') NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `user_id` (`user_id`),
  KEY `staff_id` (`staff_id`),
  CONSTRAINT `conversations_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`),
  CONSTRAINT `conversations_ibfk_2` FOREIGN KEY (`staff_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=48 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `conversations`
--

LOCK TABLES `conversations` WRITE;
/*!40000 ALTER TABLE `conversations` DISABLE KEYS */;
INSERT INTO `conversations` VALUES (4,7,5,NULL,'receptionist','active','2025-11-27 07:14:15','2025-11-28 13:38:25');
/*!40000 ALTER TABLE `conversations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dependent_profiles`
--

DROP TABLE IF EXISTS `dependent_profiles`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dependent_profiles` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `guardian_user_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `dob` date DEFAULT NULL,
  `gender` varchar(10) DEFAULT NULL,
  `relationship` varchar(50) DEFAULT NULL COMMENT 'Ví dụ: Cha, Mẹ, Con, Vợ/Chồng',
  `phone` varchar(15) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `guardian_user_id` (`guardian_user_id`),
  CONSTRAINT `dependent_profiles_ibfk_1` FOREIGN KEY (`guardian_user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dependent_profiles`
--

LOCK TABLES `dependent_profiles` WRITE;
/*!40000 ALTER TABLE `dependent_profiles` DISABLE KEYS */;
INSERT INTO `dependent_profiles` VALUES (1,7,'Nguyễn Văn A','1970-01-01','male','Cha','0382813849','2025-11-23 07:29:00'),(2,7,'Nguyễn Thị B','1973-04-04','female','Mẹ','0921684732','2025-11-23 07:29:36');
/*!40000 ALTER TABLE `dependent_profiles` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctor_schedules`
--

DROP TABLE IF EXISTS `doctor_schedules`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doctor_schedules` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `doctor_id` int(11) NOT NULL,
  `work_date` date NOT NULL,
  `time_slots` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`time_slots`)),
  `is_day_off` tinyint(1) DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `updated_at` timestamp NOT NULL DEFAULT current_timestamp() ON UPDATE current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `doctor_id` (`doctor_id`,`work_date`),
  CONSTRAINT `doctor_schedules_ibfk_1` FOREIGN KEY (`doctor_id`) REFERENCES `doctors` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=46 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctor_schedules`
--

LOCK TABLES `doctor_schedules` WRITE;
/*!40000 ALTER TABLE `doctor_schedules` DISABLE KEYS */;
INSERT INTO `doctor_schedules` VALUES (1,6,'2025-11-14','[\"16:00\",\"16:30\",\"15:30\",\"15:00\",\"14:30\",\"14:00\"]',0,'2025-11-14 19:00:17','2025-11-14 19:24:58'),(10,6,'2025-11-15','[\"13:00\",\"13:30\",\"12:00\",\"12:30\",\"11:00\",\"11:30\"]',0,'2025-11-14 19:16:55','2025-11-14 19:25:41'),(16,6,'2025-11-30','[\"08:00\",\"08:30\",\"09:00\",\"09:30\",\"10:00\",\"10:30\",\"11:00\",\"11:30\",\"12:00\"]',0,'2025-11-15 17:54:29','2025-11-15 17:54:29'),(17,6,'2025-11-26','[\"12:00\",\"12:30\",\"13:00\",\"13:30\",\"14:00\",\"14:30\",\"15:00\",\"15:30\",\"16:00\",\"16:30\"]',0,'2025-11-15 17:54:42','2025-11-15 17:54:42'),(19,6,'2025-11-20','[]',1,'2025-11-15 18:08:57','2025-11-15 18:15:18'),(20,6,'2026-11-01','[]',1,'2025-11-15 18:09:42','2025-11-15 18:09:42'),(21,6,'2025-11-17','[]',1,'2025-11-15 18:15:15','2025-11-15 18:15:15'),(23,6,'2025-11-23','[]',1,'2025-11-15 18:15:21','2025-11-15 18:15:21'),(24,6,'2025-11-22','[\"08:00\",\"08:30\",\"09:00\",\"09:30\",\"10:00\",\"10:30\",\"11:00\",\"11:30\",\"12:00\",\"12:30\",\"13:00\",\"13:30\",\"14:00\",\"14:30\",\"15:00\",\"15:30\",\"16:00\",\"16:30\"]',0,'2025-11-22 07:19:16','2025-11-22 07:34:05'),(33,6,'2025-11-29','[\"08:00\",\"08:30\",\"09:00\",\"09:30\",\"10:00\",\"10:30\",\"12:00\",\"11:00\",\"11:30\",\"12:30\",\"13:00\",\"13:30\"]',0,'2025-11-22 07:27:16','2025-11-22 07:29:45'),(43,6,'2025-11-24','[\"08:00\",\"08:30\",\"09:00\",\"09:30\",\"10:00\",\"10:30\",\"11:00\",\"11:30\",\"12:00\",\"12:30\",\"13:00\",\"13:30\",\"14:00\",\"14:30\",\"15:00\",\"15:30\"]',0,'2025-11-22 07:34:37','2025-11-22 07:34:37');
/*!40000 ALTER TABLE `doctor_schedules` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `doctors`
--

DROP TABLE IF EXISTS `doctors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `doctors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `specialty` varchar(255) DEFAULT 'Nha khoa tổng quát',
  `service_id` int(11) DEFAULT NULL,
  `bio` text DEFAULT NULL,
  `morning_start` time DEFAULT '08:00:00',
  `morning_end` time DEFAULT '12:00:00',
  `afternoon_start` time DEFAULT '13:00:00',
  `afternoon_end` time DEFAULT '17:00:00',
  `image_url` varchar(255) DEFAULT NULL,
  `user_id` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_id` (`user_id`),
  CONSTRAINT `fk_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `doctors`
--

LOCK TABLES `doctors` WRITE;
/*!40000 ALTER TABLE `doctors` DISABLE KEYS */;
INSERT INTO `doctors` VALUES (3,'TS.BS.Nguyễn Hiếu Tùng','Nha khoa',NULL,'Đến nay, bác sĩ Tùng đã có hơn 20 năm hoạt động trong lĩnh vực nha khoa. Với chuyên môn cao, tay nghề giỏi, kinh nghiệm dày dặn, ông chính là một trong những bác sĩ RHM, chuyên gia cấy ghép Implant hàng đầu ngành TP HCM và Việt Nam.','08:00:00','12:00:00','13:00:00','17:00:00','/uploads/1762457855529-bsiNguyenHieuTung.jpg',9,1),(5,'TS.BS.Đỗ Đình Hùng','Nha khoa',NULL,'Tiến sĩ – Bác sĩ Đỗ Đình Hùng tốt nghiệp Đại học Y dược TPHCM sau đó ông đi tu nghiệp Đại học ở Houston, Texas 5 năm. Sau đó, ông trở về Việt Nam làm việc, tham gia nhiều hội thảo trong và ngoài nước. Trước khi đến bệnh viện Worldwide, ông đã từng giữ chức vụ PGĐ Bệnh viện Răng hàm mặt Trung Ương TP.HCM.','08:00:00','12:00:00','13:00:00','17:00:00','/uploads/1762457825338-bsiDoDinhHung.jpg',10,1),(6,'BS.Nguyễn Ngọc Tân','Nha khoa',NULL,'Là vị bác sĩ có “bàn tay vàng”, giỏi nhiều lĩnh vực chuyên khoa khác nhau, bác sĩ Tân chính là bác sĩ nha khoa giỏi ở TPHCM được nhiều người tìm kiếm hiện nay. Với nhiều năm kinh nghiệm trong nghề, đặc biệt 10 năm trong lĩnh vực cấy ghép Implant, đến nay ông đã hỗ trợ cho hàng ngàn bệnh nhân cả nước nói chung và Sài Gòn nói riêng.','08:00:00','12:00:00','13:00:00','17:00:00','/uploads/1762457551378-bsiNguyenNgocTan.jpg',11,1),(7,'Ths.BS.Nguyễn Lê Hữu Khoa','Nha khoa',NULL,'Thế mạnh của bác sĩ Khoa đó là điều trị các vấn đề bệnh lý răng miệng và nha khoa thẩm mỹ (chỉnh nha, phục hình răng sứ, trám răng, hàn răng). Là người vui vẻ, hài hước nên ông luôn được các cháu thiếu nhi yêu quý, an tâm mỗi khi đến đây. Nhờ đó tình trạng răng miệng của các con được cải thiện nhanh chóng.','08:00:00','12:00:00','13:00:00','17:00:00','/uploads/1762457624421-bsiNguyenLeHuuKhoa.jpg',12,1),(8,'TS.BS.Trần Thị Nguyên Ny','Nha khoa',NULL,'Thế mạnh của bác sĩ Ny là nha khoa tổng quát, bệnh lý về răng hàm mặt, bệnh lý khớp cắn, chỉnh nha, cấy ghép Implant. Với mỗi dịch vụ đều được bà thực hiện nghiêm túc, có tâm và có hiệu quả tốt, được nhiều người đánh giá cao.','08:00:00','12:00:00','13:00:00','17:00:00','/uploads/1762457880380-bsiTranThiNguyenNy.jpg',13,1),(9,'TS.BS.Nguyễn Thanh Tùng','Nha khoa',NULL,'Chuyên môn chính của bác sĩ Tùng là những vấn đề bệnh lý về hàm mặt (điều trị, phẫu thuật, cấy ghép nha khoa). Ông đã từng thực hiện nhiều ca khó như phẫu thuật u răng, phẫu thuật bướu nhầy xương hàm, điều trị hội chứng đa răng dư ngầm hay bone cement.','08:00:00','12:00:00','13:00:00','17:00:00','/uploads/1762457896023-bsiNguyenThanhTung.jpg',14,1),(10,'TTUT - BSCKII.Nguyễn Chí Cường','Nha khoa',NULL,'Bác sĩ Cường có hơn 40 năm công tác trong lĩnh vực Răng Hàm Mặt, trải qua nhiều vai trò khác nhau ở những bệnh viện lớn nhỏ trên địa bàn. Ông từng giữ chức Trưởng khoa Phẫu thuật Hàm Mặt tại BV Răng Hàm Mặt TPHCM. Đồng thời, ông còn là giảng viên trường ĐH Y dược. Hiện nay, ông đang công tác tại Nha Khoa Thẩm mỹ Nacera.','08:00:00','12:00:00','13:00:00','17:00:00','/uploads/1762457951537-bsiNguyenChiCuong.jpg',15,1),(11,'BS.Cang Hồng Thái','Nha khoa',NULL,'Bác sĩ Hồng Thái luôn không ngừng nỗ lực học hỏi, nghiên cứu để đưa ra tư vấn tốt nhất cho mỗi khách hàng. Nhờ đó, ông đã đạt được rất nhiều bằng cấp uy tín như: Chứng chỉ Phẫu thuật Implant; chứng chỉ nha khoa thẩm mỹ…','08:00:00','12:00:00','13:00:00','17:00:00','/uploads/1762458038816-bsiCangHongThai.jpg',16,1);
/*!40000 ALTER TABLE `doctors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `messages`
--

DROP TABLE IF EXISTS `messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `conversation_id` int(11) NOT NULL,
  `sender_id` int(11) NOT NULL,
  `content` text NOT NULL,
  `message_type` enum('text','image') NOT NULL DEFAULT 'text',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `sender_id` (`sender_id`),
  KEY `messages_ibfk_1` (`conversation_id`),
  CONSTRAINT `messages_ibfk_1` FOREIGN KEY (`conversation_id`) REFERENCES `conversations` (`id`) ON DELETE CASCADE,
  CONSTRAINT `messages_ibfk_2` FOREIGN KEY (`sender_id`) REFERENCES `users` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `messages`
--

LOCK TABLES `messages` WRITE;
/*!40000 ALTER TABLE `messages` DISABLE KEYS */;
INSERT INTO `messages` VALUES (5,4,7,'tôi cần tư vấn hủy lịch','text','2025-11-27 08:44:10'),(7,4,7,'0986172542','text','2025-11-27 08:49:56'),(8,4,5,'bạn chờ mình tra cứu thông tin lại nha','text','2025-11-27 08:53:27'),(9,4,7,'Ok','text','2025-11-27 08:54:01'),(11,4,5,'Mình đã hủy lịch rồi nha','text','2025-11-27 09:01:01'),(12,4,7,'Cảm ơn ','text','2025-11-27 09:01:25'),(13,4,5,'Chào bạn','text','2025-11-27 09:19:43'),(14,4,7,'Hello','text','2025-11-27 09:19:57'),(15,4,5,'Mình hủy lịch ròi nha','text','2025-11-27 09:20:09'),(62,4,5,'Chào bạn','text','2025-11-28 13:38:15'),(63,4,5,'Bạn có lịch hẹn vào ngày mai nha','text','2025-11-28 13:38:25');
/*!40000 ALTER TABLE `messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `services`
--

DROP TABLE IF EXISTS `services`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `services` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(15,2) NOT NULL DEFAULT 0.00,
  `duration_minutes` int(11) DEFAULT 30,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `services`
--

LOCK TABLES `services` WRITE;
/*!40000 ALTER TABLE `services` DISABLE KEYS */;
INSERT INTO `services` VALUES (1,'Khám và tư vấn','Kiểm tra tổng quát tình trạng răng miệng',0.00,30),(2,'Cạo vôi răng','Làm sạch mảng bám và vôi răng',100.00,30),(3,'Trám răng','Điều trị sâu răngg',100.00,30);
/*!40000 ALTER TABLE `services` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `users`
--

DROP TABLE IF EXISTS `users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(50) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `email` varchar(100) NOT NULL,
  `phone` varchar(15) DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `role` enum('user','admin','doctor','receptionist') NOT NULL DEFAULT 'user',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `date_of_birth` date DEFAULT NULL,
  `gender` enum('male','female','other') DEFAULT NULL,
  `address` text DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=10000 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `users`
--

LOCK TABLES `users` WRITE;
/*!40000 ALTER TABLE `users` DISABLE KEYS */;
INSERT INTO `users` VALUES (4,'admin123',NULL,'ngphuong30071@gmail.com',NULL,'$2b$10$hWszzj/ESaXs8JIaAg9q1es.U98JIj6HwI/mWwONQu6nk.bb5Td3e','admin','2025-11-02 09:24:58',NULL,NULL,NULL),(5,'rec123',NULL,'ndnphuong3007@gmail.com',NULL,'$2b$10$y/Xj4OFz1eY7yvnF8VfnVeguy8R38io4XYko1SE1aeFgEw6Ns.44K','receptionist','2025-11-03 17:40:44',NULL,NULL,NULL),(7,'phuong123','Nguyen Dinh Nguyen Phuong','nguyenphuong200407@gmail.com','0986172542','$2b$10$sXWj3/QBpbrrnFaslkbZv.NPMKOyuAxRPciX7fcKQMuT5ZYX1rVgS','user','2025-11-04 14:47:13','2004-07-30','male','69/1/25'),(9,'HieuTung123',NULL,'hieutung123@gmail.com',NULL,'$2b$10$CrVlAUG3JczR4.N.IQwtJO8Ylll64FDjwZNAct9vSAUrLtLYIaLgq','doctor','2025-11-07 08:47:42',NULL,NULL,NULL),(10,'dodinhhung123',NULL,'dodinhhung123@gmail.com',NULL,'$2b$10$EuDS2/Mo4y127EPYInHQW.CmmFVTNTQJGYfEXLKE9lYHFHkY5mrhO','doctor','2025-11-07 08:48:50',NULL,NULL,NULL),(11,'ngoctan1',NULL,'nguyenngoctan123@gmail.com',NULL,'$2b$10$Hu.2DG7DF5LNfNWj0/wHz.d31uY9tw7nj5KKgrbuT5X1WME/ru9WC','doctor','2025-11-07 08:49:22',NULL,NULL,NULL),(12,'huukhoa123',NULL,'huukhoa123@gmail.com',NULL,'$2b$10$aIePG4yXpPUInco60sDLWu/VhV6vFGrdtlpVehh1AQfA/ULZtGFXy','doctor','2025-11-07 08:49:53',NULL,NULL,NULL),(13,'nguyenny123',NULL,'nguyenny123@gmail.com',NULL,'$2b$10$9VE9YUOyqwA0bQs2BeYkVe8psBJtthj4e84lh34XOD26r0slL4ORe','doctor','2025-11-07 08:50:18',NULL,NULL,NULL),(14,'thanhtung123',NULL,'thanhtung123@gmail.com',NULL,'$2b$10$EXieXiDARx489l4ZNWQg8uoWonCzeLl.ZIJKyEDG2fZ3vzotreYh6','doctor','2025-11-07 08:50:46',NULL,NULL,NULL),(15,'chicuong123',NULL,'chicuong123@gmail.com',NULL,'$2b$10$nIKIueVXfZL7zcT6L4HYgO3QadKtKdjd9N7FXY7VFgfb3OT7NjCR6','doctor','2025-11-07 08:51:03',NULL,NULL,NULL),(16,'hongthai123',NULL,'hongthai123@gmail.com',NULL,'$2b$10$3hA4idNxzbIDpgRHoe0fkOesVRGSnzOAGemnx1C76QK9m9ndFz3P6','doctor','2025-11-07 08:51:21',NULL,NULL,NULL),(9999,'guest_user',NULL,'guest@system.local',NULL,'dummy','','2025-11-27 11:09:00',NULL,NULL,NULL);
/*!40000 ALTER TABLE `users` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-12-07 12:57:41
