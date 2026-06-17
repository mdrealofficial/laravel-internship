-- phpMyAdmin SQL Dump
-- version 5.2.1
-- https://www.phpmyadmin.net/
--
-- Host: localhost
-- Generation Time: Jun 17, 2026 at 04:55 PM
-- Server version: 10.4.28-MariaDB
-- PHP Version: 8.2.4

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `internship`
--

-- --------------------------------------------------------

--
-- Table structure for table `applications`
--

CREATE TABLE `applications` (
  `id` char(36) NOT NULL,
  `form_id` char(36) NOT NULL,
  `applicant_name` varchar(255) NOT NULL,
  `applicant_email` varchar(255) NOT NULL,
  `applicant_phone` varchar(255) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'submitted',
  `admin_notes` text DEFAULT NULL,
  `reviewed_by` char(36) DEFAULT NULL,
  `reviewed_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `delivery_status` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `applications`
--

INSERT INTO `applications` (`id`, `form_id`, `applicant_name`, `applicant_email`, `applicant_phone`, `status`, `admin_notes`, `reviewed_by`, `reviewed_at`, `created_at`, `updated_at`, `delivery_status`) VALUES
('3f9c8a5f-e1f3-4722-aae9-25a29fef2da6', 'f4af59ad-9c12-41b5-904e-f76f13893b39', 'Md Real', 'mdreal.official@gmail.com', '01910212149', 'approved', '', NULL, '2026-06-17 08:44:12', '2025-12-13 03:29:55', '2026-06-17 08:44:12', 'sent (Email & SMS)'),
('71145672-2866-43c8-9e4b-10311614a5e6', '984bb68b-7d8a-4594-9088-628299c3a5ac', 'sasdfasd', 'admin4@gmail.com', '02384912045', 'approved', NULL, NULL, '2026-06-17 08:51:32', '2026-06-17 06:58:05', '2026-06-17 08:51:32', 'sent (Email & SMS)');

-- --------------------------------------------------------

--
-- Table structure for table `application_forms`
--

CREATE TABLE `application_forms` (
  `id` char(36) NOT NULL,
  `department_id` char(36) DEFAULT NULL,
  `title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `slug` varchar(255) NOT NULL,
  `deadline` timestamp NULL DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `application_forms`
--

INSERT INTO `application_forms` (`id`, `department_id`, `title`, `description`, `slug`, `deadline`, `is_active`, `created_by`, `created_at`, `updated_at`) VALUES
('984bb68b-7d8a-4594-9088-628299c3a5ac', 'abf8ba06-1068-404b-af3f-3b364581bbf4', 'test2', 'sadfasdf', 'test2', '2026-06-29 18:00:00', 1, NULL, '2026-06-17 06:57:34', '2026-06-17 06:57:34'),
('f4af59ad-9c12-41b5-904e-f76f13893b39', 'd34260ee-2ca1-4883-b966-48ed4c50cd96', 'Internship 2026', 'DIGI5 LTD is a UK-based software and automation company.\n\nWe are offering a hands-on internship program for 2026 where interns will work on real production systems, APIs, automation tools, and modern web applications.\n\nThis internship is learning-focused and performance-based, designed for students and fresh developers who want real industry experience.', '2026', '2026-06-23 18:00:00', 1, NULL, '2025-12-10 13:42:47', '2026-06-17 06:56:25');

-- --------------------------------------------------------

--
-- Table structure for table `application_responses`
--

CREATE TABLE `application_responses` (
  `id` char(36) NOT NULL,
  `application_id` char(36) NOT NULL,
  `field_id` char(36) NOT NULL,
  `response_value` text DEFAULT NULL,
  `file_url` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `application_responses`
--

INSERT INTO `application_responses` (`id`, `application_id`, `field_id`, `response_value`, `file_url`, `created_at`) VALUES
('6288dacf-e30c-4ac7-8178-2e7a8c3e176b', '71145672-2866-43c8-9e4b-10311614a5e6', 'f4bdfc96-1e3c-4a83-94ef-1d1a6c5bd0b4', 'sadfasd', NULL, '2026-06-17 06:58:05'),
('66f368a1-bcf2-4f28-a864-e676809cb757', '71145672-2866-43c8-9e4b-10311614a5e6', 'dc6eaca6-1ac7-4210-901d-31e77e278da4', '2345234', NULL, '2026-06-17 06:58:05'),
('a3e79c35-3331-4fd9-86ec-fc6c28ee9b45', '71145672-2866-43c8-9e4b-10311614a5e6', '1d5bced6-c79e-4ba1-9b01-a5e4cc44a6da', '2026-06-23', NULL, '2026-06-17 06:58:05');

-- --------------------------------------------------------

--
-- Table structure for table `cache`
--

CREATE TABLE `cache` (
  `key` varchar(255) NOT NULL,
  `value` mediumtext NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `cache_locks`
--

CREATE TABLE `cache_locks` (
  `key` varchar(255) NOT NULL,
  `owner` varchar(255) NOT NULL,
  `expiration` bigint(20) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `certificates`
--

CREATE TABLE `certificates` (
  `id` char(36) NOT NULL,
  `certificate_id` varchar(255) NOT NULL,
  `intern_id` char(36) NOT NULL,
  `template_type` varchar(255) DEFAULT NULL,
  `issued_date` date DEFAULT NULL,
  `issued_by` char(36) DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `qr_code_data` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  `delivery_status` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `certificates`
--

INSERT INTO `certificates` (`id`, `certificate_id`, `intern_id`, `template_type`, `issued_date`, `issued_by`, `status`, `qr_code_data`, `created_at`, `updated_at`, `delivery_status`) VALUES
('35796c0b-7999-48ca-b9c2-9ada50a8a6b6', 'DIGI5-MQI35NJ8-ESIT', 'd8caebae-ecdc-4015-b8bc-1e35b3a567aa', 'modern', '2026-06-17', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', 'issued', 'http://127.0.0.1:8000/verify?id=DIGI5-MQI35NJ8-ESIT', '2026-06-17 07:07:24', '2026-06-17 07:07:24', NULL),
('3f23b170-f19d-4a45-921a-82f41325ca9b', 'DIGI5-MJ1I232R-5DVO', '9c6c05b5-d1b5-4c1f-a0eb-0bd36ebcfacf', 'minimal', '2025-12-11', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', 'issued', 'https://internship.digi5.net/verify?id=DIGI5-MJ1I232R-5DVO', '2025-12-11 07:54:31', '2025-12-11 08:01:20', NULL),
('c5ea7a2e-c17d-4e9b-baf6-3c2d6539f278', 'DIGI5-MJ44UM7Y-RGYW', 'f5476071-9b95-48b9-94f5-daa2d3e920f3', 'minimal', '2025-12-13', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', 'issued', 'https://e80c7d33-7c70-4a56-a14f-5b39fe9eeb6c.lovableproject.com/verify?id=DIGI5-MJ44UM7Y-RGYW', '2025-12-13 04:08:07', '2025-12-14 08:09:23', NULL),
('d78de0dc-6432-432d-9e78-d88525b6b088', 'DIGI5-MJ0B1RBU-2YGJ', '42c97850-512e-444b-8fa0-b524e2079c0e', 'minimal', '2025-12-10', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', 'issued', 'https://e80c7d33-7c70-4a56-a14f-5b39fe9eeb6c.lovableproject.com/verify?id=DIGI5-MJ0B1RBU-2YGJ', '2025-12-10 11:50:32', '2025-12-13 04:09:27', NULL),
('f6983d0c-ddde-490d-b1a0-3f37fec7bd5f', 'DIGI5-MQI6Q26H-03IX', 'db4934f3-74e8-4ff0-a525-750ed0afe7a9', 'modern', '2026-06-17', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', 'issued', 'http://127.0.0.1:8000/verify?id=DIGI5-MQI6Q26H-03IX', '2026-06-17 08:47:15', '2026-06-17 08:47:26', 'sent (Email & SMS)');

-- --------------------------------------------------------

--
-- Table structure for table `departments`
--

CREATE TABLE `departments` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `head_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `departments`
--

INSERT INTO `departments` (`id`, `name`, `description`, `head_name`, `created_at`, `updated_at`) VALUES
('1c1aac6c-0545-4a49-b3c0-c664df222428', 'Video Editing', 'Video production and post-processing', NULL, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('45c4c3a6-e202-4f70-8ef4-09f3401ea3d8', 'Frontend Development', 'Web frontend development using modern frameworks', NULL, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('72f333b4-d8f1-4b37-a5ea-dd0c36e1a1ef', 'Graphic Design', 'Visual design and brand identity', NULL, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('abf8ba06-1068-404b-af3f-3b364581bbf4', 'Automation & RPA', 'Process automation and robotic process automation', NULL, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('d34260ee-2ca1-4883-b966-48ed4c50cd96', 'Digital Marketing', 'Online marketing and growth strategies', NULL, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('f6fc53b7-4cb1-4afc-bfde-05e68638246d', 'Backend Development', 'Server-side development and API design', NULL, '2025-12-10 11:42:05', '2025-12-10 11:42:05');

-- --------------------------------------------------------

--
-- Table structure for table `department_skills`
--

CREATE TABLE `department_skills` (
  `id` char(36) NOT NULL,
  `department_id` char(36) NOT NULL,
  `skill_name` varchar(255) NOT NULL,
  `skill_description` text DEFAULT NULL,
  `display_order` int(11) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `department_skills`
--

INSERT INTO `department_skills` (`id`, `department_id`, `skill_name`, `skill_description`, `display_order`, `created_at`, `updated_at`) VALUES
('0067b4a0-d966-4be1-a04d-40a2ede73897', 'abf8ba06-1068-404b-af3f-3b364581bbf4', 'RPA Tools', 'UiPath, Automation Anywhere, etc.', 2, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('02db9e6a-9531-4809-824e-4a9bade28a8a', '72f333b4-d8f1-4b37-a5ea-dd0c36e1a1ef', 'UI/UX Design', 'User interface and experience design', 3, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('076d2a28-d829-4e5f-87e6-e06fd056b78f', 'd34260ee-2ca1-4883-b966-48ed4c50cd96', 'SEO/SEM', 'Search engine optimization and marketing', 1, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('082cd22e-ceb4-4887-aef9-28abdb4830c1', 'd34260ee-2ca1-4883-b966-48ed4c50cd96', 'Email Marketing', 'Campaign management and automation', 5, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('1ae2003b-5d37-4d94-9398-6297e3ff414c', '72f333b4-d8f1-4b37-a5ea-dd0c36e1a1ef', 'Adobe Photoshop', 'Image editing and manipulation', 1, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('1dab07ce-e7f6-46ec-a649-bb154dff5b96', 'f6fc53b7-4cb1-4afc-bfde-05e68638246d', 'Security Best Practices', 'Authentication and authorization', 4, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('24626055-ff25-42c6-b78e-b0519b481973', 'abf8ba06-1068-404b-af3f-3b364581bbf4', 'Testing & QA', 'Quality assurance and testing', 5, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('29dde17b-4f32-43ff-998b-51164fc5276b', '1c1aac6c-0545-4a49-b3c0-c664df222428', 'Motion Graphics', 'After Effects and animations', 2, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('2a80c648-86fe-45f4-872f-c7d65bb0a96d', '45c4c3a6-e202-4f70-8ef4-09f3401ea3d8', 'Responsive Design', 'Mobile-first and adaptive layouts', 4, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('2b272589-b681-4a76-abc6-e0215a70e690', 'abf8ba06-1068-404b-af3f-3b364581bbf4', 'Workflow Design', 'Process mapping and optimization', 4, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('2fc935bd-b731-4e90-bd48-78f4302bb83d', 'f6fc53b7-4cb1-4afc-bfde-05e68638246d', 'API Development', 'REST and GraphQL APIs', 3, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('31d53305-44ef-45c4-8cb2-02f649685ab4', 'abf8ba06-1068-404b-af3f-3b364581bbf4', 'API Integration', 'Connecting systems via APIs', 3, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('34f1ed39-720b-482e-ace5-33c243bc5779', 'd34260ee-2ca1-4883-b966-48ed4c50cd96', 'Content Strategy', 'Content planning and creation', 3, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('38e2b24a-ebc9-450a-b2b4-209a4f432fae', '45c4c3a6-e202-4f70-8ef4-09f3401ea3d8', 'HTML & CSS', 'Markup and styling fundamentals', 1, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('3d16e355-cb37-49d2-b886-0623baf13499', 'd34260ee-2ca1-4883-b966-48ed4c50cd96', 'Analytics & Reporting', 'Data analysis and insights', 4, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('459fa607-af70-41ef-8fd6-654a33512938', '1c1aac6c-0545-4a49-b3c0-c664df222428', 'Sound Design', 'Audio editing and mixing', 4, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('47a378ac-c06d-43d2-92fa-0d2e93696501', '72f333b4-d8f1-4b37-a5ea-dd0c36e1a1ef', 'Brand Identity', 'Logo and brand guidelines', 4, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('56de0f20-482f-43e5-b709-02f18de925fc', 'f6fc53b7-4cb1-4afc-bfde-05e68638246d', 'Cloud Services', 'AWS, GCP, or Azure', 5, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('631398e2-9fd7-4fa5-b978-d7cad0f471ad', 'f6fc53b7-4cb1-4afc-bfde-05e68638246d', 'Database Management', 'SQL and NoSQL databases', 2, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('6587dbb2-2d0e-485c-8682-4627a3f31129', '1c1aac6c-0545-4a49-b3c0-c664df222428', 'Color Grading', 'Color correction and styling', 3, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('68099bd7-1e89-4be0-b3ae-9496ffba148d', '45c4c3a6-e202-4f70-8ef4-09f3401ea3d8', 'UI/UX Implementation', 'Translating designs to code', 5, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('7d7976de-e36d-4c87-8466-dd7633cac913', '72f333b4-d8f1-4b37-a5ea-dd0c36e1a1ef', 'Typography', 'Font selection and text layout', 5, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('82767692-d645-4189-9965-454e77b11ff3', '45c4c3a6-e202-4f70-8ef4-09f3401ea3d8', 'React/Vue/Angular', 'Modern frontend frameworks', 3, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('92e60659-955e-4c76-96a3-b7f2ec555379', 'abf8ba06-1068-404b-af3f-3b364581bbf4', 'Python Scripting', 'Automation scripts and tools', 1, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('952626d6-76ed-4f2e-848a-1c2a11e5f10e', '72f333b4-d8f1-4b37-a5ea-dd0c36e1a1ef', 'Adobe Illustrator', 'Vector graphics and illustrations', 2, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('982de9a8-cc0d-4e40-9cbb-f7d08c8d6590', '1c1aac6c-0545-4a49-b3c0-c664df222428', 'Storytelling', 'Narrative structure and pacing', 5, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('9f591848-47ce-4fe3-b996-ecea1f0ba94a', 'f6fc53b7-4cb1-4afc-bfde-05e68638246d', 'Node.js/Python', 'Server-side programming', 1, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('d27e3fc2-8b21-4476-93e9-f5aeeeb35638', '45c4c3a6-e202-4f70-8ef4-09f3401ea3d8', 'JavaScript/TypeScript', 'Core programming languages', 2, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('e6f69749-aa41-4b1f-a198-942879f7eccb', 'd34260ee-2ca1-4883-b966-48ed4c50cd96', 'Social Media Marketing', 'Platform-specific strategies', 2, '2025-12-10 11:42:05', '2025-12-10 11:42:05'),
('ed253067-9676-42e8-be64-a391d3002216', '1c1aac6c-0545-4a49-b3c0-c664df222428', 'Premiere Pro/Final Cut', 'Professional editing software', 1, '2025-12-10 11:42:05', '2025-12-10 11:42:05');

-- --------------------------------------------------------

--
-- Table structure for table `failed_jobs`
--

CREATE TABLE `failed_jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `uuid` varchar(255) NOT NULL,
  `connection` varchar(255) NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `exception` longtext NOT NULL,
  `failed_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `form_fields`
--

CREATE TABLE `form_fields` (
  `id` char(36) NOT NULL,
  `form_id` char(36) NOT NULL,
  `label` varchar(255) NOT NULL,
  `placeholder` varchar(255) DEFAULT NULL,
  `field_type` varchar(255) NOT NULL,
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `options` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`options`)),
  `validation_rules` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`validation_rules`)),
  `display_order` int(11) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `form_fields`
--

INSERT INTO `form_fields` (`id`, `form_id`, `label`, `placeholder`, `field_type`, `is_required`, `options`, `validation_rules`, `display_order`, `created_at`, `updated_at`) VALUES
('1d5bced6-c79e-4ba1-9b01-a5e4cc44a6da', '984bb68b-7d8a-4594-9088-628299c3a5ac', 'New date fieldsdfasd', NULL, 'date', 0, NULL, NULL, 1, '2026-06-17 06:57:34', '2026-06-17 06:57:34'),
('5bea52c3-540b-4853-abbe-9122ff586dcc', 'f4af59ad-9c12-41b5-904e-f76f13893b39', 'Internship Type', NULL, 'radio', 1, '\"[\\\"Remote\\\",\\\"In Office\\\"]\"', NULL, 0, '2026-06-17 06:56:25', '2026-06-17 06:56:25'),
('dc6eaca6-1ac7-4210-901d-31e77e278da4', '984bb68b-7d8a-4594-9088-628299c3a5ac', 'Adsafsad', NULL, 'text', 1, NULL, NULL, 0, '2026-06-17 06:57:34', '2026-06-17 06:57:34'),
('f4bdfc96-1e3c-4a83-94ef-1d1a6c5bd0b4', '984bb68b-7d8a-4594-9088-628299c3a5ac', 'sdfasd', NULL, 'phone', 0, NULL, NULL, 2, '2026-06-17 06:57:34', '2026-06-17 06:57:34');

-- --------------------------------------------------------

--
-- Table structure for table `interns`
--

CREATE TABLE `interns` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `department_id` char(36) DEFAULT NULL,
  `role_title` varchar(255) NOT NULL,
  `description` text DEFAULT NULL,
  `phone` varchar(255) DEFAULT NULL,
  `start_date` date NOT NULL,
  `end_date` date DEFAULT NULL,
  `status` varchar(255) NOT NULL DEFAULT 'pending',
  `supervisor_name` varchar(255) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `interns`
--

INSERT INTO `interns` (`id`, `user_id`, `department_id`, `role_title`, `description`, `phone`, `start_date`, `end_date`, `status`, `supervisor_name`, `created_at`, `updated_at`) VALUES
('42c97850-512e-444b-8fa0-b524e2079c0e', 'b48d24a6-6e9e-4a1e-992b-6c7751159ce8', '45c4c3a6-e202-4f70-8ef4-09f3401ea3d8', 'Frontend Intern', NULL, NULL, '2025-08-20', '2025-12-09', 'completed', 'Sheikh Kaisar Rahman', '2025-12-10 11:49:37', '2025-12-10 11:50:25'),
('9c6c05b5-d1b5-4c1f-a0eb-0bd36ebcfacf', '1557ee71-b5d8-4c22-bc80-3aa177663cad', '45c4c3a6-e202-4f70-8ef4-09f3401ea3d8', 'Graphic Design Intern', NULL, NULL, '2025-09-25', '2025-12-10', 'completed', 'Md Real', '2025-12-11 07:52:53', '2025-12-11 07:54:24'),
('d8caebae-ecdc-4015-b8bc-1e35b3a567aa', '442540c3-fffd-4186-aeef-8563eb8376a6', 'abf8ba06-1068-404b-af3f-3b364581bbf4', 'sdfasdf', NULL, '02384912045', '2026-06-17', '2026-06-30', 'completed', 'sdfasdf', '2026-06-17 07:07:05', '2026-06-17 07:07:18'),
('db4934f3-74e8-4ff0-a525-750ed0afe7a9', '7413c890-b396-4cf9-9cf2-d605f6c6b895', '45c4c3a6-e202-4f70-8ef4-09f3401ea3d8', 'Frontend Developer', NULL, '01910212149', '2026-06-17', '2026-09-17', 'completed', 'John Doe', '2026-06-17 08:45:31', '2026-06-17 08:46:51'),
('f5476071-9b95-48b9-94f5-daa2d3e920f3', '7a75dc6e-b5e1-42eb-ae55-145d297e8cb0', 'f6fc53b7-4cb1-4afc-bfde-05e68638246d', 'Software developer Intern', NULL, NULL, '2025-10-15', '2025-12-14', 'completed', 'Md Real', '2025-12-13 03:48:59', '2025-12-13 04:07:53');

-- --------------------------------------------------------

--
-- Table structure for table `intern_skill_assessments`
--

CREATE TABLE `intern_skill_assessments` (
  `id` char(36) NOT NULL,
  `intern_id` char(36) NOT NULL,
  `skill_id` char(36) NOT NULL,
  `rating` int(11) DEFAULT NULL,
  `notes` text DEFAULT NULL,
  `assessed_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `intern_skill_assessments`
--

INSERT INTO `intern_skill_assessments` (`id`, `intern_id`, `skill_id`, `rating`, `notes`, `assessed_by`, `created_at`, `updated_at`) VALUES
('038e7b4b-9ecb-4ff2-9746-6ce5031097e6', '42c97850-512e-444b-8fa0-b524e2079c0e', '82767692-d645-4189-9965-454e77b11ff3', 80, NULL, NULL, '2025-12-10 11:50:13', '2025-12-10 11:50:13'),
('192d53d8-2bbb-4f02-9363-244bd9b8b53c', 'f5476071-9b95-48b9-94f5-daa2d3e920f3', '631398e2-9fd7-4fa5-b978-d7cad0f471ad', 95, NULL, NULL, '2025-12-13 06:48:42', '2025-12-13 06:48:42'),
('2c5d4375-6518-40ab-a734-ffde6bde8ce5', 'f5476071-9b95-48b9-94f5-daa2d3e920f3', '9f591848-47ce-4fe3-b996-ecea1f0ba94a', 50, NULL, NULL, '2025-12-13 06:48:41', '2025-12-13 06:48:41'),
('2d476967-ed1f-40de-9096-c7e3bb991643', '42c97850-512e-444b-8fa0-b524e2079c0e', '2a80c648-86fe-45f4-872f-c7d65bb0a96d', 100, NULL, NULL, '2025-12-10 11:50:13', '2025-12-10 11:50:13'),
('41d3d00a-6408-45c4-a6c6-ace827ce6f7a', '9c6c05b5-d1b5-4c1f-a0eb-0bd36ebcfacf', 'd27e3fc2-8b21-4476-93e9-f5aeeeb35638', 75, NULL, NULL, '2025-12-11 07:53:42', '2025-12-11 07:53:42'),
('558aac32-faae-4abb-b665-63b4c942616a', 'f5476071-9b95-48b9-94f5-daa2d3e920f3', '56de0f20-482f-43e5-b709-02f18de925fc', 95, NULL, NULL, '2025-12-13 06:48:42', '2025-12-13 06:48:42'),
('61fe1af3-6cb4-4acc-9289-1afe7c7c0a4c', '42c97850-512e-444b-8fa0-b524e2079c0e', '68099bd7-1e89-4be0-b3ae-9496ffba148d', 60, NULL, NULL, '2025-12-10 11:50:13', '2025-12-10 11:50:13'),
('6293b3fe-6ed5-4277-b3e2-f15a5fe3649a', 'd8caebae-ecdc-4015-b8bc-1e35b3a567aa', '2b272589-b681-4a76-abc6-e0215a70e690', 90, NULL, NULL, '2026-06-17 08:31:59', '2026-06-17 08:31:59'),
('6e3c3915-2898-430d-b54a-27629cd40a67', '9c6c05b5-d1b5-4c1f-a0eb-0bd36ebcfacf', '38e2b24a-ebc9-450a-b2b4-209a4f432fae', 50, NULL, NULL, '2025-12-11 07:53:42', '2025-12-11 07:53:42'),
('7d082b9a-b4a8-4fab-aa0f-fed61fb0c6ea', 'd8caebae-ecdc-4015-b8bc-1e35b3a567aa', '0067b4a0-d966-4be1-a04d-40a2ede73897', 80, NULL, NULL, '2026-06-17 08:31:59', '2026-06-17 08:31:59'),
('7f3072c4-3512-4756-a3a8-2894b4e6e19a', 'd8caebae-ecdc-4015-b8bc-1e35b3a567aa', '92e60659-955e-4c76-96a3-b7f2ec555379', 85, NULL, NULL, '2026-06-17 08:31:59', '2026-06-17 08:31:59'),
('8c93b721-642a-42e8-942b-2dfc80c497f5', '42c97850-512e-444b-8fa0-b524e2079c0e', 'd27e3fc2-8b21-4476-93e9-f5aeeeb35638', 25, NULL, NULL, '2025-12-10 11:50:12', '2025-12-10 11:50:12'),
('a94f4b98-306f-48e6-b76d-fc3c089ee876', '9c6c05b5-d1b5-4c1f-a0eb-0bd36ebcfacf', '82767692-d645-4189-9965-454e77b11ff3', 100, NULL, NULL, '2025-12-11 07:53:42', '2025-12-11 07:53:42'),
('aa2860f5-56a7-4efc-8b52-c6bf60d40738', 'f5476071-9b95-48b9-94f5-daa2d3e920f3', '2fc935bd-b731-4e90-bd48-78f4302bb83d', 60, NULL, NULL, '2025-12-13 06:48:42', '2025-12-13 06:48:42'),
('bf6cfe95-57d4-403f-9605-5064a1f83e28', 'd8caebae-ecdc-4015-b8bc-1e35b3a567aa', '31d53305-44ef-45c4-8cb2-02f649685ab4', 100, NULL, NULL, '2026-06-17 08:31:59', '2026-06-17 08:31:59'),
('bf709d9c-fa32-4086-9be7-c0ab47e6cce2', 'd8caebae-ecdc-4015-b8bc-1e35b3a567aa', '24626055-ff25-42c6-b78e-b0519b481973', 75, NULL, NULL, '2026-06-17 08:31:59', '2026-06-17 08:31:59'),
('c4102297-b40f-4837-8db3-8a2902282550', 'f5476071-9b95-48b9-94f5-daa2d3e920f3', '1dab07ce-e7f6-46ec-a649-bb154dff5b96', 45, NULL, NULL, '2025-12-13 06:48:42', '2025-12-13 06:48:42'),
('df1c953a-7fe0-4b48-a4c6-9c7e6335711a', '9c6c05b5-d1b5-4c1f-a0eb-0bd36ebcfacf', '68099bd7-1e89-4be0-b3ae-9496ffba148d', 50, NULL, NULL, '2025-12-11 07:53:43', '2025-12-11 07:53:43'),
('f46ad2b7-e9a3-4516-bc16-985e18b9f149', '9c6c05b5-d1b5-4c1f-a0eb-0bd36ebcfacf', '2a80c648-86fe-45f4-872f-c7d65bb0a96d', 30, NULL, NULL, '2025-12-11 07:53:43', '2025-12-11 07:53:43'),
('febfe000-8d3c-4afc-98b7-258ca724b170', '42c97850-512e-444b-8fa0-b524e2079c0e', '38e2b24a-ebc9-450a-b2b4-209a4f432fae', 50, NULL, NULL, '2025-12-10 11:50:12', '2025-12-10 11:50:12');

-- --------------------------------------------------------

--
-- Table structure for table `jobs`
--

CREATE TABLE `jobs` (
  `id` bigint(20) UNSIGNED NOT NULL,
  `queue` varchar(255) NOT NULL,
  `payload` longtext NOT NULL,
  `attempts` smallint(5) UNSIGNED NOT NULL,
  `reserved_at` int(10) UNSIGNED DEFAULT NULL,
  `available_at` int(10) UNSIGNED NOT NULL,
  `created_at` int(10) UNSIGNED NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `job_batches`
--

CREATE TABLE `job_batches` (
  `id` varchar(255) NOT NULL,
  `name` varchar(255) NOT NULL,
  `total_jobs` int(11) NOT NULL,
  `pending_jobs` int(11) NOT NULL,
  `failed_jobs` int(11) NOT NULL,
  `failed_job_ids` longtext NOT NULL,
  `options` mediumtext DEFAULT NULL,
  `cancelled_at` int(11) DEFAULT NULL,
  `created_at` int(11) NOT NULL,
  `finished_at` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `migrations`
--

CREATE TABLE `migrations` (
  `id` int(10) UNSIGNED NOT NULL,
  `migration` varchar(255) NOT NULL,
  `batch` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `migrations`
--

INSERT INTO `migrations` (`id`, `migration`, `batch`) VALUES
(1, '0001_01_01_000000_create_users_table', 1),
(2, '0001_01_01_000001_create_cache_table', 1),
(3, '0001_01_01_000002_create_jobs_table', 1),
(4, '2026_06_17_000003_create_internship_tables', 1),
(5, '2026_06_17_141246_add_delivery_status_to_certificates_table', 2),
(6, '2026_06_17_142407_add_delivery_status_to_applications_table', 3),
(7, '2026_06_17_144835_create_role_titles_table', 4);

-- --------------------------------------------------------

--
-- Table structure for table `nav_menu_items`
--

CREATE TABLE `nav_menu_items` (
  `id` char(36) NOT NULL,
  `label` varchar(255) NOT NULL,
  `url` varchar(255) NOT NULL,
  `display_order` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `is_external` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `nav_menu_items`
--

INSERT INTO `nav_menu_items` (`id`, `label`, `url`, `display_order`, `is_active`, `is_external`, `created_at`, `updated_at`) VALUES
('4c49b683-e46c-4648-9740-b3f6deffcd8f', 'About', '/about', 1, 1, 0, '2026-06-17 06:55:25', '2026-06-17 06:55:47');

-- --------------------------------------------------------

--
-- Table structure for table `notification_logs`
--

CREATE TABLE `notification_logs` (
  `id` char(36) NOT NULL,
  `recipient` varchar(255) NOT NULL,
  `notification_type` varchar(255) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `body` text DEFAULT NULL,
  `template_key` varchar(255) DEFAULT NULL,
  `status` varchar(255) DEFAULT NULL,
  `error_message` text DEFAULT NULL,
  `metadata` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL CHECK (json_valid(`metadata`)),
  `sent_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_logs`
--

INSERT INTO `notification_logs` (`id`, `recipient`, `notification_type`, `subject`, `body`, `template_key`, `status`, `error_message`, `metadata`, `sent_at`) VALUES
('01ce5d63-b875-49a0-92a7-11744f191414', '01910212149', 'sms', NULL, 'Congratulations hello! Your DIGI5 certificate (DIGI5-MQI6Q26H-03IX) is ready. Verify: http://127.0.0.1:8000/verify?id=DIGI5-MQI6Q26H-03IX', 'certificate_issued', 'sent', NULL, '{\"template_id\":\"3fa11c2d-7be2-4b11-8fda-bc20171ef5fe\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 08:47:26'),
('070892dc-fdad-42d7-a6e6-6b8cd375a3e8', '01910212149', 'sms', NULL, 'This is a test SMS from DIGI5 LTD. If you received this, your SMS gateway is configured correctly!', 'test_sms', 'sent', NULL, '{\"test\": true, \"api_response\": {\"msg\": \"Request successfully submitted\", \"data\": {\"request_id\": 15807221}, \"error\": 0}}', '2025-12-13 03:22:17'),
('0a003542-35b7-4156-a185-23dc86c230af', 'mdreal.official@gmail.com', 'email', '🎉 Your Certificate is Ready - DIGI5-MQI6Q26H-03IX', 'Dear hello,\n\nCongratulations! Your internship certificate has been issued.\n\nCertificate ID: DIGI5-MQI6Q26H-03IX\nDepartment: Frontend Development\nRole: Frontend Developer\n\nVerify your certificate at: http://127.0.0.1:8000/verify?id=DIGI5-MQI6Q26H-03IX\n\nBest regards,\nDIGI5 LTD Team', 'certificate_issued', 'sent', NULL, '{\"template_id\":\"8d952615-7a26-41a1-8014-13fd58d6daa1\"}', '2026-06-17 08:47:15'),
('0d091aec-1c02-4233-860a-0c6f380ca136', '01910212149', 'sms', NULL, 'Congratulations hello! Your DIGI5 certificate (DIGI5-MQI6Q26H-03IX) is ready. Verify: http://127.0.0.1:8000/verify?id=DIGI5-MQI6Q26H-03IX', 'certificate_issued', 'sent', NULL, '{\"template_id\":\"3fa11c2d-7be2-4b11-8fda-bc20171ef5fe\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 08:47:15'),
('17c52fd6-9cd4-4843-8835-9e4691d01939', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your DIGI5 certificate (DIGI5-MQI35NJ8-ESIT) is ready. Verify: http://127.0.0.1:8000/verify?id=DIGI5-MQI35NJ8-ESIT', 'certificate_issued', 'sent', NULL, '{\"template_id\":\"3fa11c2d-7be2-4b11-8fda-bc20171ef5fe\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:07:46'),
('2ae1d903-5cf0-4cf5-9152-a090feac4dcd', 'admin4@gmail.com', 'email', 'Test Subject Update', 'Dear sasdfasd,\n\nCongratulations! We are delighted to inform you that your application for the test2 position has been approved.\n\nWelcome to the DIGI5 LTD team! We are excited to have you on board. You will receive further instructions regarding your onboarding process shortly.\n\nBest regards,\nDIGI5 LTD Team', 'application_approved', 'sent', NULL, '{\"template_id\":\"0279e47a-0962-465e-8a09-8d04cb623b88\"}', '2026-06-17 07:01:47'),
('2b13f767-5973-4629-a2d8-d2fb77b4b15e', '01910212149', 'sms', NULL, 'Hi Md Real, your application for Internship 2026 status: approved. - DIGI5 LTD', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"2cdab9b2-32a4-4810-a71e-7341805b7ed1\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 08:43:33'),
('2f7a04c0-1bef-40d4-8765-5833505c5cdb', 'admin4@gmail.com', 'email', 'Application Update - test2', 'Dear sasdfasd,\n\nYour application for test2 has been updated.\n\nNew Status: approved\n\n{{#if admin_notes}}\nNotes: {{admin_notes}}\n{{/if}}\n\nBest regards,\nDIGI5 LTD Team', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"95244a00-89e5-48c0-bf46-3322417f219d\"}', '2026-06-17 08:35:07'),
('322d4d21-2db6-4e9d-b4b7-4cab7b179b1e', 'internships@digi5.net', 'email', 'Test Email from DIGI5 LTD', 'This is a test email from your SMTP configuration.', 'test_email', 'sent', NULL, '{\"test\": true, \"api_response\": {\"message\": \"SMTP email queued (custom SMTP requires relay setup)\"}}', '2025-12-10 13:17:24'),
('32642625-cc0b-4859-a16c-3e809d8f4fa0', 'admin4@gmail.com', 'email', '🎉 Your Certificate is Ready - DIGI5-MQI35NJ8-ESIT', 'Dear sasdfasd,\n\nCongratulations! Your internship certificate has been issued.\n\nCertificate ID: DIGI5-MQI35NJ8-ESIT\nDepartment: Automation & RPA\nRole: sdfasdf\n\nVerify your certificate at: http://127.0.0.1:8000/verify?id=DIGI5-MQI35NJ8-ESIT\n\nBest regards,\nDIGI5 LTD Team', 'certificate_issued', 'sent', NULL, '{\"template_id\":\"8d952615-7a26-41a1-8014-13fd58d6daa1\"}', '2026-06-17 07:07:46'),
('333327ff-a475-44e9-8dca-f9fadb5b3cb0', 'admin4@gmail.com', 'email', 'Congratulations! You have been Shortlisted - DIGI5 LTD', 'Dear sasdfasd,\n\nGreat news! Your application for the test2 position at DIGI5 LTD has been shortlisted.\n\nWe were impressed with your profile and would like to move forward with your application. Our team will reach out to you shortly with next steps.\n\nBest regards,\nDIGI5 LTD Team', 'application_shortlisted', 'sent', NULL, '{\"template_id\":\"466f99d1-40aa-41bb-88ad-b757257e6746\"}', '2026-06-17 07:06:54'),
('36c101fd-24a0-4dca-b660-c459acf7c63e', 'admin4@gmail.com', 'email', 'Test Subject Update', 'Dear sasdfasd,\n\nCongratulations! We are delighted to inform you that your application for the test2 position has been approved.\n\nWelcome to the DIGI5 LTD team! We are excited to have you on board. You will receive further instructions regarding your onboarding process shortly.\n\nBest regards,\nDIGI5 LTD Team', 'application_approved', 'sent', NULL, '{\"template_id\":\"0279e47a-0962-465e-8a09-8d04cb623b88\"}', '2026-06-17 07:00:05'),
('3e28ee41-dbb2-4ee7-859a-c99f1f07285e', 'internships@digi5.net', 'email', 'Test Email from DIGI5 LTD', 'This is a test email from your SMTP configuration.', 'test_email', 'sent', NULL, '{\"test\": true, \"api_response\": {\"message\": \"SMTP email queued (custom SMTP requires relay setup)\"}}', '2025-12-13 03:21:48'),
('4d5ac2e7-1e2d-470b-9adf-753699e642bb', '01910212149', 'sms', NULL, 'Hi Md Real, your application for Internship 2026 status: approved. - DIGI5 LTD', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"2cdab9b2-32a4-4810-a71e-7341805b7ed1\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 08:44:12'),
('4e0d6396-5bee-43af-af50-d074bd8d46e0', 'admin4@gmail.com', 'email', 'Congratulations! You have been Shortlisted - DIGI5 LTD', 'Dear sasdfasd,\n\nGreat news! Your application for the test2 position at DIGI5 LTD has been shortlisted.\n\nWe were impressed with your profile and would like to move forward with your application. Our team will reach out to you shortly with next steps.\n\nBest regards,\nDIGI5 LTD Team', 'application_shortlisted', 'sent', NULL, '{\"template_id\":\"466f99d1-40aa-41bb-88ad-b757257e6746\"}', '2026-06-17 07:01:44'),
('56274390-bf67-4290-816f-ff82bdd14f95', 'admin4@gmail.com', 'email', 'Test Subject Update', 'Dear sasdfasd,\n\nCongratulations! We are delighted to inform you that your application for the test2 position has been approved.\n\nWelcome to the DIGI5 LTD team! We are excited to have you on board. You will receive further instructions regarding your onboarding process shortly.\n\nBest regards,\nDIGI5 LTD Team', 'application_approved', 'sent', NULL, '{\"template_id\":\"0279e47a-0962-465e-8a09-8d04cb623b88\"}', '2026-06-17 07:06:56'),
('5c710d2d-ca14-4d3a-9da5-2adffe51c91a', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been approved. Welcome to the team!', 'application_approved', 'sent', NULL, '{\"template_id\":\"cd4b91ba-6d62-4415-814e-8a3028182f41\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:01:47'),
('5cbfc4b7-9da7-418c-8639-356fc663e746', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been shortlisted. We will contact you soon.', 'application_shortlisted', 'sent', NULL, '{\"template_id\":\"aabc40d9-f7c1-4009-9760-4e181dc06b27\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:01:44'),
('61075179-44c4-4f06-a56c-e0913442c30d', 'mdreal.official@gmail.com', 'email', 'Application Update - Internship 2026', 'Dear Md Real,\n\nYour application for Internship 2026 has been updated.\n\nNew Status: approved\n\n{{#if admin_notes}}\nNotes: {{admin_notes}}\n{{/if}}\n\nBest regards,\nDIGI5 LTD Team', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"95244a00-89e5-48c0-bf46-3322417f219d\"}', '2026-06-17 08:44:12'),
('622cc059-7469-4527-8d51-1551601d76a5', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been approved. Welcome to the team!', 'application_approved', 'sent', NULL, '{\"template_id\":\"cd4b91ba-6d62-4415-814e-8a3028182f41\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:00:21'),
('631352de-aad3-42a9-9c5f-9e758818bd7c', 'admin4@gmail.com', 'email', 'Test Subject Update', 'Dear sasdfasd,\n\nCongratulations! We are delighted to inform you that your application for the test2 position has been approved.\n\nWelcome to the DIGI5 LTD team! We are excited to have you on board. You will receive further instructions regarding your onboarding process shortly.\n\nBest regards,\nDIGI5 LTD Team', 'application_approved', 'sent', NULL, '{\"template_id\":\"0279e47a-0962-465e-8a09-8d04cb623b88\"}', '2026-06-17 07:04:57'),
('6fe31bd8-5f99-4f46-bae1-0756ddf26bb8', '01910212149', 'sms', NULL, 'This is a test SMS from DIGI5 LTD. If you received this, your SMS gateway is configured correctly!', 'test_sms', 'sent', NULL, '{\"test\": true, \"api_response\": {\"msg\": \"Request successfully submitted\", \"data\": {\"request_id\": 15807252}, \"error\": 0}}', '2025-12-13 03:23:36'),
('749b3ac4-2d89-41be-b971-4845fd261339', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been shortlisted. We will contact you soon.', 'application_shortlisted', 'sent', NULL, '{\"template_id\":\"aabc40d9-f7c1-4009-9760-4e181dc06b27\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:06:05'),
('85a6c815-b15b-4e77-a046-aa4526a54d4b', 'admin4@gmail.com', 'email', 'Test Subject Update', 'Dear sasdfasd,\n\nCongratulations! We are delighted to inform you that your application for the test2 position has been approved.\n\nWelcome to the DIGI5 LTD team! We are excited to have you on board. You will receive further instructions regarding your onboarding process shortly.\n\nBest regards,\nDIGI5 LTD Team', 'application_approved', 'sent', NULL, '{\"template_id\":\"0279e47a-0962-465e-8a09-8d04cb623b88\"}', '2026-06-17 07:06:17'),
('8a38ccbf-7619-48cb-a03d-a4e324e48edc', 'admin4@gmail.com', 'email', 'Application Update - test2', 'Dear sasdfasd,\n\nYour application for test2 has been updated.\n\nNew Status: approved\n\n{{#if admin_notes}}\nNotes: {{admin_notes}}\n{{/if}}\n\nBest regards,\nDIGI5 LTD Team', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"95244a00-89e5-48c0-bf46-3322417f219d\"}', '2026-06-17 08:51:32'),
('8f33d9f5-8888-42eb-918c-e5d6598ce5ed', 'mdreal.official@gmail.com', 'email', 'Application Update - Internship 2026', 'Dear Md Real,\n\nYour application for Internship 2026 has been updated.\n\nNew Status: approved\n\n{{#if admin_notes}}\nNotes: {{admin_notes}}\n{{/if}}\n\nBest regards,\nDIGI5 LTD Team', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"95244a00-89e5-48c0-bf46-3322417f219d\"}', '2026-06-17 08:43:33'),
('914674ea-50e5-4c98-bebd-536a9412957b', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been shortlisted. We will contact you soon.', 'application_shortlisted', 'sent', NULL, '{\"template_id\":\"aabc40d9-f7c1-4009-9760-4e181dc06b27\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:06:54'),
('95048116-8035-4ede-a02b-cdecdce87360', '02384912045', 'sms', NULL, 'Hi sasdfasd, your application for test2 status: approved. - DIGI5 LTD', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"2cdab9b2-32a4-4810-a71e-7341805b7ed1\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 08:33:07'),
('a49b117d-35ca-46a0-aaff-e7bd6aa9bea6', '01910212149', 'sms', NULL, 'This is a test SMS from DIGI5 LTD. If you received this, your SMS gateway is configured correctly!', 'test_sms', 'sent', NULL, '{\"test\": true, \"api_response\": {\"msg\": \"Request successfully submitted\", \"data\": {\"request_id\": 15740541}, \"error\": 0}}', '2025-12-10 13:08:21'),
('a9ed47af-03cd-4673-a367-04bcdaf15dd2', 'admin4@gmail.com', 'email', 'Test Subject Update', 'Dear sasdfasd,\n\nCongratulations! We are delighted to inform you that your application for the test2 position has been approved.\n\nWelcome to the DIGI5 LTD team! We are excited to have you on board. You will receive further instructions regarding your onboarding process shortly.\n\nBest regards,\nDIGI5 LTD Team', 'application_approved', 'sent', NULL, '{\"template_id\":\"0279e47a-0962-465e-8a09-8d04cb623b88\"}', '2026-06-17 07:00:21'),
('abce699b-de16-4c5a-882f-c35751c55be9', 'admin4@gmail.com', 'email', 'Congratulations! You have been Shortlisted - DIGI5 LTD', 'Dear sasdfasd,\n\nGreat news! Your application for the test2 position at DIGI5 LTD has been shortlisted.\n\nWe were impressed with your profile and would like to move forward with your application. Our team will reach out to you shortly with next steps.\n\nBest regards,\nDIGI5 LTD Team', 'application_shortlisted', 'sent', NULL, '{\"template_id\":\"466f99d1-40aa-41bb-88ad-b757257e6746\"}', '2026-06-17 07:04:54'),
('adb68880-cfd3-47e1-9b06-82cfdf9f6a40', '02384912045', 'sms', NULL, 'Hi sasdfasd, your application for test2 at DIGI5 LTD is now under review. We will contact you soon.', 'application_reviewing', 'sent', NULL, '{\"template_id\":\"94af928f-75f9-4aff-a019-dfdf524df00e\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:00:17'),
('b944c493-c44c-4973-a9ad-44946172a84d', '02384912045', 'sms', NULL, 'Hi sasdfasd, your application for test2 status: approved. - DIGI5 LTD', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"2cdab9b2-32a4-4810-a71e-7341805b7ed1\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 08:35:07'),
('c0c5f50b-4313-42f6-8bd1-786e326f43b5', 'admin4@gmail.com', 'email', 'Your Application is Under Review - DIGI5 LTD', 'Dear sasdfasd,\n\nThank you for your application for the test2 position at DIGI5 LTD.\n\nWe are pleased to inform you that your application is currently under review by our team. We will get back to you soon with further updates.\n\nBest regards,\nDIGI5 LTD Team', 'application_reviewing', 'sent', NULL, '{\"template_id\":\"e9b5fe00-7e33-4419-a27b-07f50196f780\"}', '2026-06-17 07:00:17'),
('cf8c0e14-7f84-42b1-b745-cd65896bb467', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been approved. Welcome to the team!', 'application_approved', 'sent', NULL, '{\"template_id\":\"cd4b91ba-6d62-4415-814e-8a3028182f41\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:06:17'),
('cf9b4042-8f21-4d91-95a4-ddcdca658a23', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been approved. Welcome to the team!', 'application_approved', 'sent', NULL, '{\"template_id\":\"cd4b91ba-6d62-4415-814e-8a3028182f41\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:00:05'),
('d63985f4-75ca-449c-944c-a99042f93d13', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been approved. Welcome to the team!', 'application_approved', 'sent', NULL, '{\"template_id\":\"cd4b91ba-6d62-4415-814e-8a3028182f41\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:06:56'),
('d9314739-b277-43e8-9d34-f0cdce44844d', 'admin4@gmail.com', 'email', '🎉 Your Certificate is Ready - DIGI5-MQI35NJ8-ESIT', 'Dear sasdfasd,\n\nCongratulations! Your internship certificate has been issued.\n\nCertificate ID: DIGI5-MQI35NJ8-ESIT\nDepartment: Automation & RPA\nRole: sdfasdf\n\nVerify your certificate at: http://127.0.0.1:8000/verify?id=DIGI5-MQI35NJ8-ESIT\n\nBest regards,\nDIGI5 LTD Team', 'certificate_issued', 'sent', NULL, '{\"template_id\":\"8d952615-7a26-41a1-8014-13fd58d6daa1\"}', '2026-06-17 07:07:24'),
('dc184e07-1ead-4b16-9c25-51083c1de8bf', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been approved. Welcome to the team!', 'application_approved', 'sent', NULL, '{\"template_id\":\"cd4b91ba-6d62-4415-814e-8a3028182f41\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:04:57'),
('e22e25a9-fcda-4256-8d08-9a7a18209812', '02384912045', 'sms', NULL, 'Hi sasdfasd, your application for test2 status: approved. - DIGI5 LTD', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"2cdab9b2-32a4-4810-a71e-7341805b7ed1\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 08:51:32'),
('e45f36af-3463-4d62-b95b-22989b6f428b', 'mdreal.official@gmail.com', 'email', '🎉 Your Certificate is Ready - DIGI5-MQI6Q26H-03IX', 'Dear hello,\n\nCongratulations! Your internship certificate has been issued.\n\nCertificate ID: DIGI5-MQI6Q26H-03IX\nDepartment: Frontend Development\nRole: Frontend Developer\n\nVerify your certificate at: http://127.0.0.1:8000/verify?id=DIGI5-MQI6Q26H-03IX\n\nBest regards,\nDIGI5 LTD Team', 'certificate_issued', 'sent', NULL, '{\"template_id\":\"8d952615-7a26-41a1-8014-13fd58d6daa1\"}', '2026-06-17 08:47:26'),
('eb50ecda-6551-4d7c-981c-fcb56fb80f97', 'admin4@gmail.com', 'email', 'Application Update - test2', 'Dear sasdfasd,\n\nYour application for test2 has been updated.\n\nNew Status: approved\n\n{{#if admin_notes}}\nNotes: {{admin_notes}}\n{{/if}}\n\nBest regards,\nDIGI5 LTD Team', 'application_status_changed', 'sent', NULL, '{\"template_id\":\"95244a00-89e5-48c0-bf46-3322417f219d\"}', '2026-06-17 08:33:07'),
('f56f5913-9fce-4881-bcd9-5c1c80deb345', '01910212149', 'sms', NULL, 'This is a test SMS from DIGI5 LTD. If you received this, your SMS gateway is configured correctly!', 'test_sms', 'sent', NULL, '{\"test\": true, \"api_response\": {\"msg\": \"Request successfully submitted\", \"data\": {\"request_id\": 15740524}, \"error\": 0}}', '2025-12-10 13:05:33'),
('f9f9fe29-519c-4aa2-a4e9-f96f2842ab0b', 'admin4@gmail.com', 'email', 'Congratulations! You have been Shortlisted - DIGI5 LTD', 'Dear sasdfasd,\n\nGreat news! Your application for the test2 position at DIGI5 LTD has been shortlisted.\n\nWe were impressed with your profile and would like to move forward with your application. Our team will reach out to you shortly with next steps.\n\nBest regards,\nDIGI5 LTD Team', 'application_shortlisted', 'sent', NULL, '{\"template_id\":\"466f99d1-40aa-41bb-88ad-b757257e6746\"}', '2026-06-17 07:06:05'),
('faa769e4-a2d7-4321-96fd-0c29408b6c64', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your DIGI5 certificate (DIGI5-MQI35NJ8-ESIT) is ready. Verify: http://127.0.0.1:8000/verify?id=DIGI5-MQI35NJ8-ESIT', 'certificate_issued', 'sent', NULL, '{\"template_id\":\"3fa11c2d-7be2-4b11-8fda-bc20171ef5fe\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:07:24'),
('fb35084a-55bd-4c4d-9823-520541bc7abc', '02384912045', 'sms', NULL, 'Congratulations sasdfasd! Your application for test2 at DIGI5 LTD has been shortlisted. We will contact you soon.', 'application_shortlisted', 'sent', NULL, '{\"template_id\":\"aabc40d9-f7c1-4009-9760-4e181dc06b27\",\"api_response\":{\"error\":410,\"msg\":\"Account expired\"}}', '2026-06-17 07:04:54');

-- --------------------------------------------------------

--
-- Table structure for table `notification_settings`
--

CREATE TABLE `notification_settings` (
  `id` char(36) NOT NULL,
  `setting_type` varchar(255) NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `config` longtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL CHECK (json_valid(`config`)),
  `test_mode` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_settings`
--

INSERT INTO `notification_settings` (`id`, `setting_type`, `is_enabled`, `config`, `test_mode`, `created_at`, `updated_at`) VALUES
('047b7bc2-d947-40b8-ae0d-e3b1c87f85e6', 'sms', 1, '{\"method\": \"POST\", \"api_key\": \"AF46yA6872k1nddWJ9iOWQvChbyELCmSMknrm4ao\", \"api_url\": \"https://api.sms.net.bd/sendsms\", \"sender_id\": \"SME CUBE\"}', 0, '2025-12-10 12:45:01', '2025-12-13 03:23:32'),
('053112b0-eb03-43bb-a942-34d2a7be2873', 'smtp', 1, '{\"host\":\"smtp.gmail.com\",\"port\":587}', 0, '2025-12-10 12:45:01', '2026-06-17 06:50:00');

-- --------------------------------------------------------

--
-- Table structure for table `notification_templates`
--

CREATE TABLE `notification_templates` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `template_key` varchar(255) NOT NULL,
  `template_type` varchar(255) NOT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `body_template` text NOT NULL,
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `notification_templates`
--

INSERT INTO `notification_templates` (`id`, `name`, `template_key`, `template_type`, `subject`, `body_template`, `is_enabled`, `created_at`, `updated_at`) VALUES
('0279e47a-0962-465e-8a09-8d04cb623b88', 'Application Approved', 'application_approved', 'email', 'Test Subject Update', 'Dear {{applicant_name}},\n\nCongratulations! We are delighted to inform you that your application for the {{position}} position has been approved.\n\nWelcome to the {{company_name}} team! We are excited to have you on board. You will receive further instructions regarding your onboarding process shortly.\n\nBest regards,\n{{company_name}} Team', 1, '2025-12-13 03:54:55', '2026-06-17 06:50:00'),
('19fe106f-6d92-4158-9a98-b478bdac53ec', 'Application Submitted', 'application_submitted', 'email', 'Application Received - {{form_title}}', 'Dear {{applicant_name}},\n\nThank you for submitting your application for {{form_title}} at DIGI5 LTD.\n\nWe have received your application and our team will review it shortly. You will be notified once your application status is updated.\n\nBest regards,\nDIGI5 LTD Team', 1, '2025-12-10 12:45:01', '2025-12-10 12:45:01'),
('2cdab9b2-32a4-4810-a71e-7341805b7ed1', 'Application Status Changed', 'application_status_changed', 'sms', NULL, 'Hi {{applicant_name}}, your application for {{form_title}} status: {{application_status}}. - DIGI5 LTD', 1, '2025-12-10 12:45:01', '2025-12-10 12:45:01'),
('3d8cf1f3-4c14-4eb6-8f9c-f87277e212c1', 'Application Submitted', 'application_submitted', 'sms', NULL, 'Dear {{applicant_name}}, your application for {{form_title}} at DIGI5 LTD has been received. We will notify you of any updates.', 1, '2025-12-10 12:45:01', '2025-12-10 12:45:01'),
('3f56a87d-9418-4d2a-926f-2717a7ad088a', 'Certificate Revoked', 'certificate_revoked', 'email', 'Certificate Status Update - {{certificate_id}}', 'Dear {{intern_name}},\n\nWe regret to inform you that your certificate (ID: {{certificate_id}}) has been revoked.\n\nIf you believe this is an error, please contact our administration team.\n\nBest regards,\nDIGI5 LTD Team', 1, '2025-12-10 12:45:01', '2025-12-10 12:45:01'),
('3fa11c2d-7be2-4b11-8fda-bc20171ef5fe', 'Certificate Issued', 'certificate_issued', 'sms', NULL, 'Congratulations {{intern_name}}! Your DIGI5 certificate ({{certificate_id}}) is ready. Verify: {{verification_url}}', 1, '2025-12-10 12:45:01', '2025-12-10 12:45:01'),
('466f99d1-40aa-41bb-88ad-b757257e6746', 'Application Shortlisted', 'application_shortlisted', 'email', 'Congratulations! You have been Shortlisted - {{company_name}}', 'Dear {{applicant_name}},\n\nGreat news! Your application for the {{position}} position at {{company_name}} has been shortlisted.\n\nWe were impressed with your profile and would like to move forward with your application. Our team will reach out to you shortly with next steps.\n\nBest regards,\n{{company_name}} Team', 1, '2025-12-13 03:54:55', '2025-12-13 03:54:55'),
('75e6be9c-15a2-4871-92f3-321213ab89e0', 'Application Not Selected', 'application_rejected', 'email', 'Application Update - {{company_name}}', 'Dear {{applicant_name}},\n\nThank you for your interest in the {{position}} position at {{company_name}} and for taking the time to apply.\n\nAfter careful consideration, we regret to inform you that we will not be moving forward with your application at this time. We encourage you to apply for future opportunities that match your skills.\n\nWe wish you the best in your career endeavors.\n\nBest regards,\n{{company_name}} Team', 1, '2025-12-13 03:54:55', '2025-12-13 03:54:55'),
('8d952615-7a26-41a1-8014-13fd58d6daa1', 'Certificate Issued', 'certificate_issued', 'email', '🎉 Your Certificate is Ready - {{certificate_id}}', 'Dear {{intern_name}},\n\nCongratulations! Your internship certificate has been issued.\n\nCertificate ID: {{certificate_id}}\nDepartment: {{department_name}}\nRole: {{role_title}}\n\nVerify your certificate at: {{verification_url}}\n\nBest regards,\nDIGI5 LTD Team', 1, '2025-12-10 12:45:01', '2025-12-10 12:45:01'),
('94af928f-75f9-4aff-a019-dfdf524df00e', 'Application Under Review SMS', 'application_reviewing', 'sms', NULL, 'Hi {{applicant_name}}, your application for {{position}} at {{company_name}} is now under review. We will contact you soon.', 1, '2025-12-13 03:54:55', '2025-12-13 03:54:55'),
('95244a00-89e5-48c0-bf46-3322417f219d', 'Application Status Changed', 'application_status_changed', 'email', 'Application Update - {{form_title}}', 'Dear {{applicant_name}},\n\nYour application for {{form_title}} has been updated.\n\nNew Status: {{application_status}}\n\n{{#if admin_notes}}\nNotes: {{admin_notes}}\n{{/if}}\n\nBest regards,\nDIGI5 LTD Team', 1, '2025-12-10 12:45:01', '2025-12-10 12:45:01'),
('aabc40d9-f7c1-4009-9760-4e181dc06b27', 'Application Shortlisted SMS', 'application_shortlisted', 'sms', NULL, 'Congratulations {{applicant_name}}! Your application for {{position}} at {{company_name}} has been shortlisted. We will contact you soon.', 1, '2025-12-13 03:54:55', '2025-12-13 03:54:55'),
('b34b5be5-bc21-4758-acf8-3f7e2d8523f7', 'Application Not Selected SMS', 'application_rejected', 'sms', NULL, 'Hi {{applicant_name}}, thank you for applying to {{company_name}}. Unfortunately, we will not be moving forward with your application at this time.', 1, '2025-12-13 03:54:55', '2025-12-13 03:54:55'),
('ba9c6a15-38cf-4bea-abd0-5e72c09aba5a', 'Certificate Revoked', 'certificate_revoked', 'sms', NULL, 'Hi {{intern_name}}, your certificate {{certificate_id}} has been revoked. Contact admin for details. - DIGI5 LTD', 1, '2025-12-10 12:45:01', '2025-12-10 12:45:01'),
('cd4b91ba-6d62-4415-814e-8a3028182f41', 'Application Approved SMS', 'application_approved', 'sms', NULL, 'Congratulations {{applicant_name}}! Your application for {{position}} at {{company_name}} has been approved. Welcome to the team!', 1, '2025-12-13 03:54:55', '2025-12-13 03:54:55'),
('e9b5fe00-7e33-4419-a27b-07f50196f780', 'Application Under Review', 'application_reviewing', 'email', 'Your Application is Under Review - {{company_name}}', 'Dear {{applicant_name}},\n\nThank you for your application for the {{position}} position at {{company_name}}.\n\nWe are pleased to inform you that your application is currently under review by our team. We will get back to you soon with further updates.\n\nBest regards,\n{{company_name}} Team', 1, '2025-12-13 03:54:55', '2025-12-13 03:54:55');

-- --------------------------------------------------------

--
-- Table structure for table `password_reset_tokens`
--

CREATE TABLE `password_reset_tokens` (
  `email` varchar(255) NOT NULL,
  `token` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- --------------------------------------------------------

--
-- Table structure for table `profiles`
--

CREATE TABLE `profiles` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `email` varchar(255) NOT NULL,
  `full_name` varchar(255) DEFAULT NULL,
  `avatar_url` text DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `profiles`
--

INSERT INTO `profiles` (`id`, `user_id`, `email`, `full_name`, `avatar_url`, `created_at`, `updated_at`) VALUES
('22819b1c-66ad-44a6-b84c-aa90f2a950df', '0d6e0d5a-40c9-4e30-b509-2a30b0c5ee15', 'mdreal@gmail.com', 'hello', NULL, '2025-12-10 08:52:05', '2025-12-10 08:52:05'),
('57d71402-23e2-4b45-8729-07ca9450627f', '7a75dc6e-b5e1-42eb-ae55-145d297e8cb0', 'varax58998@lawior.com', 'hello', NULL, '2025-12-13 03:48:59', '2025-12-13 03:48:59'),
('5a108cfa-2dd3-4fb3-9e50-aa93bb231689', '6a59b6f1-95f2-4b41-a36d-53c0dd6b18ca', 'test2@gmail.com', 'Sheikh Kaisar', NULL, '2025-12-10 08:14:46', '2025-12-10 08:14:46'),
('66c89771-eb69-4970-a290-9b12b0fe05e1', 'b48d24a6-6e9e-4a1e-992b-6c7751159ce8', 'new@digi5.net', 'Md Real', NULL, '2025-12-10 11:49:37', '2025-12-10 11:49:37'),
('7397dd9f-e600-4e99-8e71-9d8aba3a59ff', '7413c890-b396-4cf9-9cf2-d605f6c6b895', 'mdreal.official@gmail.com', 'hello', NULL, '2025-12-10 07:46:29', '2025-12-10 07:46:29'),
('956c211e-0ed1-4baf-aac8-52e7bca9f3f9', '442540c3-fffd-4186-aeef-8563eb8376a6', 'admin4@gmail.com', 'sasdfasd', NULL, '2026-06-17 07:07:05', '2026-06-17 07:07:05'),
('a3ec59be-87db-4c2d-9bbc-b8456c2a4fe2', '71b9ee39-abc4-445c-a065-c849f7c37102', 'mdreal.dev@gmail.com', 'hello', NULL, '2025-12-10 08:04:31', '2025-12-10 08:04:31'),
('a4a38f66-cf31-4e4a-b1ac-463c0ba8ba41', '4b9ef724-1147-4ecb-9c34-ff05a1adbc39', 'hello99@gmail.com', 'Md Real', NULL, '2026-06-17 07:03:58', '2026-06-17 07:03:58'),
('a725bf69-f048-40cc-ac94-54a8d0d7a53e', '1557ee71-b5d8-4c22-bc80-3aa177663cad', 'nirzona.st@gmail.com', 'Nirzona', NULL, '2025-12-11 07:52:53', '2025-12-11 07:52:53'),
('f6232acf-874d-417c-bdb8-fef2628f4a55', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', 'admin@digi5.com', 'Administratora', NULL, '2025-12-10 07:36:29', '2026-06-17 06:49:36');

-- --------------------------------------------------------

--
-- Table structure for table `role_titles`
--

CREATE TABLE `role_titles` (
  `id` char(36) NOT NULL,
  `title` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `role_titles`
--

INSERT INTO `role_titles` (`id`, `title`, `created_at`, `updated_at`) VALUES
('019ed60f-018e-7177-85da-ea6d443dd283', 'Software Engineer Intern', '2026-06-17 08:49:28', '2026-06-17 08:49:28'),
('019ed60f-0191-7275-a68e-fcde2d34b353', 'Frontend Developer Intern', '2026-06-17 08:49:28', '2026-06-17 08:49:28'),
('019ed60f-0193-7270-9013-274bf4fbeef4', 'Backend Developer Intern', '2026-06-17 08:49:28', '2026-06-17 08:49:28'),
('019ed60f-0194-7087-95c1-055ef77fa635', 'UI/UX Design Intern', '2026-06-17 08:49:28', '2026-06-17 08:49:28'),
('019ed60f-0194-7087-95c1-055ef7d88d76', 'Digital Marketing Intern', '2026-06-17 08:49:28', '2026-06-17 08:49:28'),
('019ed60f-0195-7123-94dc-a61f7003ef8c', 'Data Analyst Intern', '2026-06-17 08:49:28', '2026-06-17 08:49:28'),
('019ed60f-0196-7345-a3d0-48d47af36d02', 'Project Manager Intern', '2026-06-17 08:49:28', '2026-06-17 08:49:28'),
('019ed60f-0196-7345-a3d0-48d47b16245e', 'Quality Assurance Intern', '2026-06-17 08:49:28', '2026-06-17 08:49:28');

-- --------------------------------------------------------

--
-- Table structure for table `sessions`
--

CREATE TABLE `sessions` (
  `id` varchar(255) NOT NULL,
  `user_id` char(36) DEFAULT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `user_agent` text DEFAULT NULL,
  `payload` longtext NOT NULL,
  `last_activity` int(11) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `sessions`
--

INSERT INTO `sessions` (`id`, `user_id`, `ip_address`, `user_agent`, `payload`, `last_activity`) VALUES
('9VgwZzcF01AeFLmYwDpo2IgqugtVKTt15Jt7ZxvL', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJ5cUJSbDlhYWQydmZZd0Z2OE5qNHo1V3dsZ0MwZkRJcGZNTXRGZXF1IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC9hcGlcL3N1cGFiYXNlLWNvbXBhdFwvYXV0aFwvc2Vzc2lvbiIsInJvdXRlIjpudWxsfSwiX2ZsYXNoIjp7Im9sZCI6W10sIm5ldyI6W119LCJsb2dpbl93ZWJfNTliYTM2YWRkYzJiMmY5NDAxNTgwZjAxNGM3ZjU4ZWE0ZTMwOTg5ZCI6ImYzY2MwNTRiLTQyODMtNDkxMS1iMjIxLWVjZjFkMzE3ZDViYyJ9', 1781708100),
('nmQqpqqrygACl1hy2aEvafPdG4Iu0VFsHepRFM0s', NULL, '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJwNTBqeWk5cVFqbkxRVWdSMWQwTTBHeWU3NnpGSW5McU5laGFyNVpKIiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC9hc3NldHNcL2JpbmFyeS1tYXRyaXgtQk5zdHo5Ul8ucG5nIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX19', 1781708070),
('Vru8XK8XFqiWPFlizhNEzdmyOVbhS0365u4ckdva', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', '127.0.0.1', 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36', 'eyJfdG9rZW4iOiJEYXIwU0RUT29aWDFvdnBJYnd5QmRKVXE1dTNwdDlaSXNiS3BzTTl2IiwiX3ByZXZpb3VzIjp7InVybCI6Imh0dHA6XC9cLzEyNy4wLjAuMTo4MDAwXC9hc3NldHNcL2JpbmFyeS1tYXRyaXgtQk5zdHo5Ul8ucG5nIiwicm91dGUiOm51bGx9LCJfZmxhc2giOnsib2xkIjpbXSwibmV3IjpbXX0sImxvZ2luX3dlYl81OWJhMzZhZGRjMmIyZjk0MDE1ODBmMDE0YzdmNThlYTRlMzA5ODlkIjoiZjNjYzA1NGItNDI4My00OTExLWIyMjEtZWNmMWQzMTdkNWJjIn0=', 1781707956);

-- --------------------------------------------------------

--
-- Table structure for table `site_settings`
--

CREATE TABLE `site_settings` (
  `id` char(36) NOT NULL,
  `setting_key` varchar(255) NOT NULL,
  `setting_value` text DEFAULT NULL,
  `updated_by` char(36) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `site_settings`
--

INSERT INTO `site_settings` (`id`, `setting_key`, `setting_value`, `updated_by`, `created_at`, `updated_at`) VALUES
('1bfaea0a-305d-407f-bb80-68bdb3510574', 'certificate_pattern_opacity', '11', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', '2025-12-10 11:32:00', '2025-12-13 02:27:52'),
('6e2263e9-ea67-4af2-aa6f-c909dd7de1a7', 'company_logo_url', 'http://127.0.0.1:8000/storage/company-assets/company_logo_url_1781700614606.jpg', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', '2025-12-10 10:40:48', '2026-06-17 06:50:14'),
('9f772e57-813e-4b40-81d2-3f4a3cad4ec6', 'certificate_pattern_enabled', 'true', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', '2026-06-17 06:48:14', '2026-06-17 06:48:14'),
('afbd2749-b92d-4080-b4f5-740c8ee916b7', 'certificate_pattern_url', '/assets/binary-matrix-BNstz9R_.png', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', '2025-12-10 11:20:44', '2025-12-13 23:25:07'),
('bba87add-a725-4de5-a194-852240cbb75c', 'company_name', 'TestCompany', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', '2026-06-17 06:49:18', '2026-06-17 06:49:18'),
('d8821b64-c42c-46b7-8458-0dfa6e956e5e', 'signature_url', 'http://127.0.0.1:8000/storage/company-assets/signature_url_1781700621607.png', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', '2025-12-10 10:40:48', '2026-06-17 06:50:21'),
('e81d3dcd-bd46-42ba-907a-8a0dfb45cc18', 'favicon_url', 'http://127.0.0.1:8000/storage/company-assets/favicon_url_1781700640837.png', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', '2025-12-10 10:40:48', '2026-06-17 06:50:40');

-- --------------------------------------------------------

--
-- Table structure for table `staff_assignments`
--

CREATE TABLE `staff_assignments` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `department_id` char(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `staff_assignments`
--

INSERT INTO `staff_assignments` (`id`, `user_id`, `department_id`, `created_at`) VALUES
('68e32bf0-dbb5-4664-8376-d71a489ceb80', '4b9ef724-1147-4ecb-9c34-ff05a1adbc39', 'abf8ba06-1068-404b-af3f-3b364581bbf4', '2026-06-17 07:03:58');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` char(36) NOT NULL,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `email_verified_at` timestamp NULL DEFAULT NULL,
  `password` varchar(255) NOT NULL,
  `remember_token` varchar(100) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `name`, `email`, `email_verified_at`, `password`, `remember_token`, `created_at`, `updated_at`) VALUES
('0d6e0d5a-40c9-4e30-b509-2a30b0c5ee15', 'hello', 'mdreal@gmail.com', '2025-12-10 08:52:05', '$2a$10$wle/fRqv5UsVoJIkJz3NM.Q25pFUAGFO.noKEQNYl0wWmZGXmKSPq', NULL, '2025-12-10 08:52:05', '2025-12-10 08:52:05'),
('1557ee71-b5d8-4c22-bc80-3aa177663cad', 'Nirzona', 'nirzona.st@gmail.com', '2025-12-11 07:52:53', '$2a$10$a//GaIuij//WdfGimBQUHeVn.jdYthNACT0NQof87Knx7/YuZVfju', NULL, '2025-12-11 07:52:53', '2025-12-11 07:52:53'),
('442540c3-fffd-4186-aeef-8563eb8376a6', 'sasdfasd', 'admin4@gmail.com', NULL, '$2y$12$dyhC.8zrf9sO0J4b0KbvDujfFGaBLZx08rc9xCQCGGrdjQuSGCxim', NULL, '2026-06-17 07:07:05', '2026-06-17 07:07:05'),
('4b9ef724-1147-4ecb-9c34-ff05a1adbc39', 'Md Real', 'hello99@gmail.com', NULL, '$2y$12$tKtAoqOLgxIbLSWJRj0QreibdWMNc2XfqvOLsdZ65Um4v8cHAZaq2', NULL, '2026-06-17 07:03:58', '2026-06-17 07:03:58'),
('6a59b6f1-95f2-4b41-a36d-53c0dd6b18ca', 'Sheikh Kaisar', 'test2@gmail.com', '2025-12-10 08:14:46', '$2a$10$Iz.4CmHT1zEU3aRB6dY6JuWOV2id8XdW6P6VOsOIq5xp5DHCgxpeK', NULL, '2025-12-10 08:14:46', '2025-12-10 08:14:46'),
('71b9ee39-abc4-445c-a065-c849f7c37102', 'hello', 'mdreal.dev@gmail.com', '2025-12-10 08:04:31', '$2a$10$CjVrDvQeNoR6Dgi88jOzceS8moshrpK6FKQEMyloPtSwqCeJbXHYu', NULL, '2025-12-10 08:04:31', '2025-12-10 08:04:31'),
('7413c890-b396-4cf9-9cf2-d605f6c6b895', 'hello', 'mdreal.official@gmail.com', '2025-12-10 07:46:29', '$2a$10$0hX.uPK8ydqXBEbGKKOzHeH9GY8elxZWLKCzSSxV.jFNO6Fa0K/4y', NULL, '2025-12-10 07:46:29', '2025-12-10 07:46:29'),
('7a75dc6e-b5e1-42eb-ae55-145d297e8cb0', 'hello', 'varax58998@lawior.com', '2025-12-13 03:48:59', '$2a$10$fvqH0Kqv4d2iVLR3wU4KwueuvNTb6biVOERblmbWhDZn3I1/jXyzm', NULL, '2025-12-13 03:48:59', '2025-12-13 03:48:59'),
('b48d24a6-6e9e-4a1e-992b-6c7751159ce8', 'Md Real', 'new@digi5.net', '2025-12-10 11:49:37', '$2a$10$NoEMdGXt15E0GhPuJPZ/3.6jyMdBQJLA37j27XvdOFxrGyIyo4Ava', NULL, '2025-12-10 11:49:37', '2025-12-10 11:49:37'),
('f3cc054b-4283-4911-b221-ecf1d317d5bc', 'Admin', 'admin@digi5.com', '2025-12-10 07:36:29', '$2y$12$1gCbzq.77bS4dDcq/7FyQ.kNlaeMF2dolbJ/eOLfrVkDZW.QhzPQO', 'gd1svurIEdBQgD6KgdZPffJJttYZ8Sqb7pekDl9uwnhxmPlUzsMXfGCJxi6B', '2025-12-10 07:36:29', '2026-06-17 06:55:16');

-- --------------------------------------------------------

--
-- Table structure for table `user_roles`
--

CREATE TABLE `user_roles` (
  `id` char(36) NOT NULL,
  `user_id` char(36) NOT NULL,
  `role` varchar(255) NOT NULL,
  `created_at` timestamp NULL DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

--
-- Dumping data for table `user_roles`
--

INSERT INTO `user_roles` (`id`, `user_id`, `role`, `created_at`) VALUES
('05f2ce05-6eff-4a52-a390-5347de630be4', '6a59b6f1-95f2-4b41-a36d-53c0dd6b18ca', 'intern', '2025-12-10 08:14:46'),
('0cbba25b-388e-485c-b554-716d0eba37bd', '71b9ee39-abc4-445c-a065-c849f7c37102', 'intern', '2025-12-10 08:04:31'),
('18a779dc-ec58-425b-b17b-140280ca1a19', '1557ee71-b5d8-4c22-bc80-3aa177663cad', 'intern', '2025-12-11 07:52:53'),
('2e0ebbf1-3ac8-4811-83dc-2b4db61619c9', '7a75dc6e-b5e1-42eb-ae55-145d297e8cb0', 'intern', '2025-12-13 03:48:59'),
('992bf11a-0ee8-4def-a5bb-a89bc1ccd654', '442540c3-fffd-4186-aeef-8563eb8376a6', 'intern', '2026-06-17 07:07:05'),
('a852ee94-f213-4471-9ac7-201bb75626bc', '0d6e0d5a-40c9-4e30-b509-2a30b0c5ee15', 'intern', '2025-12-10 08:52:05'),
('d05ae2bd-47fd-46cd-b1a3-0a74bf424ce5', '4b9ef724-1147-4ecb-9c34-ff05a1adbc39', 'staff', '2026-06-17 07:03:58'),
('d119fdb4-8728-4c80-af7a-e85f0689585c', '7413c890-b396-4cf9-9cf2-d605f6c6b895', 'intern', '2026-06-17 08:45:31'),
('e4ac159d-89d5-4feb-a6ad-21caf4e307dc', 'b48d24a6-6e9e-4a1e-992b-6c7751159ce8', 'intern', '2025-12-10 11:49:37'),
('f9dcaa39-d534-4518-8635-d3e767c4ef22', 'f3cc054b-4283-4911-b221-ecf1d317d5bc', 'admin', '2025-12-10 07:36:29');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `applications`
--
ALTER TABLE `applications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `applications_form_id_foreign` (`form_id`);

--
-- Indexes for table `application_forms`
--
ALTER TABLE `application_forms`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `application_forms_slug_unique` (`slug`),
  ADD KEY `application_forms_department_id_foreign` (`department_id`);

--
-- Indexes for table `application_responses`
--
ALTER TABLE `application_responses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `application_responses_application_id_foreign` (`application_id`),
  ADD KEY `application_responses_field_id_foreign` (`field_id`);

--
-- Indexes for table `cache`
--
ALTER TABLE `cache`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_expiration_index` (`expiration`);

--
-- Indexes for table `cache_locks`
--
ALTER TABLE `cache_locks`
  ADD PRIMARY KEY (`key`),
  ADD KEY `cache_locks_expiration_index` (`expiration`);

--
-- Indexes for table `certificates`
--
ALTER TABLE `certificates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `certificates_certificate_id_unique` (`certificate_id`),
  ADD KEY `certificates_intern_id_foreign` (`intern_id`);

--
-- Indexes for table `departments`
--
ALTER TABLE `departments`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `department_skills`
--
ALTER TABLE `department_skills`
  ADD PRIMARY KEY (`id`),
  ADD KEY `department_skills_department_id_foreign` (`department_id`);

--
-- Indexes for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `failed_jobs_uuid_unique` (`uuid`),
  ADD KEY `failed_jobs_connection_queue_failed_at_index` (`connection`,`queue`,`failed_at`);

--
-- Indexes for table `form_fields`
--
ALTER TABLE `form_fields`
  ADD PRIMARY KEY (`id`),
  ADD KEY `form_fields_form_id_foreign` (`form_id`);

--
-- Indexes for table `interns`
--
ALTER TABLE `interns`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `interns_user_id_unique` (`user_id`),
  ADD KEY `interns_department_id_foreign` (`department_id`);

--
-- Indexes for table `intern_skill_assessments`
--
ALTER TABLE `intern_skill_assessments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `intern_skill_assessments_intern_id_foreign` (`intern_id`),
  ADD KEY `intern_skill_assessments_skill_id_foreign` (`skill_id`);

--
-- Indexes for table `jobs`
--
ALTER TABLE `jobs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `jobs_queue_index` (`queue`);

--
-- Indexes for table `job_batches`
--
ALTER TABLE `job_batches`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `migrations`
--
ALTER TABLE `migrations`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `nav_menu_items`
--
ALTER TABLE `nav_menu_items`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notification_logs`
--
ALTER TABLE `notification_logs`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notification_settings`
--
ALTER TABLE `notification_settings`
  ADD PRIMARY KEY (`id`);

--
-- Indexes for table `notification_templates`
--
ALTER TABLE `notification_templates`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `notification_templates_template_key_template_type_unique` (`template_key`,`template_type`);

--
-- Indexes for table `password_reset_tokens`
--
ALTER TABLE `password_reset_tokens`
  ADD PRIMARY KEY (`email`);

--
-- Indexes for table `profiles`
--
ALTER TABLE `profiles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `profiles_user_id_unique` (`user_id`);

--
-- Indexes for table `role_titles`
--
ALTER TABLE `role_titles`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `role_titles_title_unique` (`title`);

--
-- Indexes for table `sessions`
--
ALTER TABLE `sessions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `sessions_user_id_index` (`user_id`),
  ADD KEY `sessions_last_activity_index` (`last_activity`);

--
-- Indexes for table `site_settings`
--
ALTER TABLE `site_settings`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `site_settings_setting_key_unique` (`setting_key`);

--
-- Indexes for table `staff_assignments`
--
ALTER TABLE `staff_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `staff_assignments_user_id_foreign` (`user_id`),
  ADD KEY `staff_assignments_department_id_foreign` (`department_id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `users_email_unique` (`email`);

--
-- Indexes for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD PRIMARY KEY (`id`),
  ADD KEY `user_roles_user_id_foreign` (`user_id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `failed_jobs`
--
ALTER TABLE `failed_jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `jobs`
--
ALTER TABLE `jobs`
  MODIFY `id` bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT;

--
-- AUTO_INCREMENT for table `migrations`
--
ALTER TABLE `migrations`
  MODIFY `id` int(10) UNSIGNED NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=8;

--
-- Constraints for dumped tables
--

--
-- Constraints for table `applications`
--
ALTER TABLE `applications`
  ADD CONSTRAINT `applications_form_id_foreign` FOREIGN KEY (`form_id`) REFERENCES `application_forms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `application_forms`
--
ALTER TABLE `application_forms`
  ADD CONSTRAINT `application_forms_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL;

--
-- Constraints for table `application_responses`
--
ALTER TABLE `application_responses`
  ADD CONSTRAINT `application_responses_application_id_foreign` FOREIGN KEY (`application_id`) REFERENCES `applications` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `application_responses_field_id_foreign` FOREIGN KEY (`field_id`) REFERENCES `form_fields` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `certificates`
--
ALTER TABLE `certificates`
  ADD CONSTRAINT `certificates_intern_id_foreign` FOREIGN KEY (`intern_id`) REFERENCES `interns` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `department_skills`
--
ALTER TABLE `department_skills`
  ADD CONSTRAINT `department_skills_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `form_fields`
--
ALTER TABLE `form_fields`
  ADD CONSTRAINT `form_fields_form_id_foreign` FOREIGN KEY (`form_id`) REFERENCES `application_forms` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `interns`
--
ALTER TABLE `interns`
  ADD CONSTRAINT `interns_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE SET NULL,
  ADD CONSTRAINT `interns_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `intern_skill_assessments`
--
ALTER TABLE `intern_skill_assessments`
  ADD CONSTRAINT `intern_skill_assessments_intern_id_foreign` FOREIGN KEY (`intern_id`) REFERENCES `interns` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `intern_skill_assessments_skill_id_foreign` FOREIGN KEY (`skill_id`) REFERENCES `department_skills` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `profiles`
--
ALTER TABLE `profiles`
  ADD CONSTRAINT `profiles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `staff_assignments`
--
ALTER TABLE `staff_assignments`
  ADD CONSTRAINT `staff_assignments_department_id_foreign` FOREIGN KEY (`department_id`) REFERENCES `departments` (`id`) ON DELETE CASCADE,
  ADD CONSTRAINT `staff_assignments_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;

--
-- Constraints for table `user_roles`
--
ALTER TABLE `user_roles`
  ADD CONSTRAINT `user_roles_user_id_foreign` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
