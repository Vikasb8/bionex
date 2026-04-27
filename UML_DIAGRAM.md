# Bionex Healthcare Platform: UML Database Schema

This UML Class Diagram illustrates the core relational database schema, detailing the key entities, their attributes, and how they interact within the Bionex platform.

```mermaid
classDiagram
    %% Core User & Authentication
    class User {
        +UUID id
        +String email
        +String name
        +String role ["patient", "doctor", "admin", "lab"]
        +String unique_health_id
        +String qr_code_url
        +String phone
        +Date date_of_birth
        +Boolean is_verified
        +DateTime created_at
    }

    %% Profiles & Extensions
    class FamilyMember {
        +UUID id
        +String member_name
        +Date date_of_birth
        +String relation
        +String unique_health_id
        +String qr_code_url
        +Boolean is_active
    }

    class DoctorProfile {
        +UUID id
        +String hospital_name
        +String specialization
        +String license_number
        +Boolean is_verified
        +DateTime verified_at
    }

    class LabProfile {
        +UUID id
        +String lab_name
        +String department
        +String license_number
        +Boolean is_verified
        +DateTime verified_at
    }

    %% Medical Data
    class MedicalRecord {
        +UUID id
        +UUID patient_id
        +String patient_type ["user", "family"]
        +String diagnosis
        +Text prescription
        +Text notes
        +String report_file_key
        +Date record_date
        +DateTime created_at
    }

    class LabTest {
        +UUID id
        +UUID patient_id
        +String patient_type ["user", "family"]
        +String test_name
        +Text test_description
        +Text result
        +String result_file_key
        +String status ["pending", "completed", "verified", "rejected"]
        +Text doctor_remarks
        +DateTime prescribed_at
        +DateTime completed_at
        +DateTime verified_at
    }

    class EmergencyData {
        +UUID id
        +String patient_type
        +String blood_group
        +JSON allergies
        +JSON chronic_conditions
        +JSON current_medications
        +String emergency_contact_name
        +String emergency_contact_phone
        +Boolean is_emergency_mode_enabled
        +String access_token
    }

    class AccessLog {
        +Integer id
        +String actor_name
        +String actor_role
        +String action
        +String ip_address
        +DateTime timestamp
    }

    %% Relationships / Cardinality
    User "1" *-- "*" FamilyMember : "manages"
    User "1" o-- "1" DoctorProfile : "acts as"
    User "1" o-- "1" LabProfile : "acts as"
    User "1" *-- "1" EmergencyData : "has critical info"

    %% Medical Record Interactions
    User "1" <-- "*" MedicalRecord : "owns (patient_id)"
    FamilyMember "1" <-- "*" MedicalRecord : "owns (patient_id)"
    DoctorProfile "1" --> "*" MedicalRecord : "creates/authors"

    %% Lab Test Interactions
    User "1" <-- "*" LabTest : "takes (patient_id)"
    FamilyMember "1" <-- "*" LabTest : "takes (patient_id)"
    DoctorProfile "1" --> "*" LabTest : "prescribes"
    LabProfile "1" --> "*" LabTest : "processes & submits"
    
    %% Audit
    User "1" --> "*" AccessLog : "generates (actor)"
```

### UML Relationship Key:
*   `*--` (Composition): A strong lifecycle dependency (e.g., if a User is deleted, their Family Members are deleted).
*   `o--` (Aggregation): A weaker dependency linking a base user to a specific role profile.
*   `-->` / `<--` (Directed Association): Denotes actions and references (e.g., A Doctor creates a Medical Record).
*   `"1" to "*"`: Indicates a One-to-Many relationship.
*   `"1" to "1"`: Indicates a One-to-One relationship.
