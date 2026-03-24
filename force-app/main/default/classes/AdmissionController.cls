/**
 * @description Admission domain controller for Experience Cloud portal
 * Handles department listing, enquiry submission,
 * document submission and fee payment.
 */

public without sharing class AdmissionController {

    /**
     * Get Departments for Seat Availability
     */
    @AuraEnabled(cacheable=true)
    public static List<Department__c> getDepartments() {

        return [
            SELECT Id,
                   Name,
                   Department_Code__c,
                   Programme_Type__c,
                   Total_Seats__c,
                   Available_Seats__c,
                   Annual_Fees__c,
                   Description__c,
                   Grade_10th_Percentage__c,
                   Grade_12th_Percentage__c,
                   UG_Percentage__c
            FROM Department__c
            WITH SECURITY_ENFORCED
            ORDER BY Programme_Type__c, Name
        ];
    }


    /**
     * Search Enquiry using Enquiry Number + Aadhar Number
     */
    @AuraEnabled
    public static Admission_Enquiry__c searchEnquiry(String enquiryNumber, String aadharNumber){

        try{

            List<Admission_Enquiry__c> enq = [

                SELECT Id,
                       Name,
                       Aadhar_Number__c,
                       Is_Eligible__c,
                       Admission_Status__c,
                       Fee_Payment_Status__c,
                       Seat_Confirmed__c,
                       Department__c,
                       Department__r.Name
                FROM Admission_Enquiry__c
                WHERE Name = :enquiryNumber
                AND Aadhar_Number__c = :aadharNumber
                LIMIT 1
            ];

            if(enq.isEmpty()){
                throw new AuraHandledException('Invalid Enquiry Number or Aadhar Number');
            }

            return enq[0];

        }catch(Exception e){

            throw new AuraHandledException('Search failed: ' + e.getMessage());

        }

    }


    /**
     * Submit Enquiry
     */
    @AuraEnabled
    public static Admission_Enquiry__c submitEnquiry(
        String deptId,
        String studentName,
        String email,
        String mobile,
        Date dob,
        Decimal tenth,
        Decimal twelfth,
        Decimal ugPercent,
        String aadharNumber
    ){

        try{

            Admission_Enquiry__c enq = new Admission_Enquiry__c(

                Department__c = deptId,
                Student_Name__c = studentName,
                Email__c = email,
                Mobile__c = mobile,
                Date_of_Birth__c = dob,
                Grade_10th_Percentage__c = tenth,
                Grade_12th_Percentage__c = twelfth,
                UG_Percentage__c = ugPercent,
                Application_Date__c = Date.today(),
                Aadhar_Number__c = aadharNumber

            );

            insert enq;

            return [

                SELECT Id,
                       Name,
                       Is_Eligible__c,
                       Admission_Status__c
                FROM Admission_Enquiry__c
                WHERE Id = :enq.Id
                LIMIT 1

            ];

        }catch(Exception e){

            throw new AuraHandledException('Failed to submit enquiry: ' + e.getMessage());

        }

    }


    /**
     * Get Latest Enquiry for Logged User
     */
    @AuraEnabled
    public static Admission_Enquiry__c getMyEnquiry(String userId){

        try{

            User u = [
                SELECT Email
                FROM User
                WHERE Id = :userId
                LIMIT 1
            ];

            List<Admission_Enquiry__c> enqs = [

                SELECT Id,
                       Name,
                       Is_Eligible__c,
                       Admission_Status__c,
                       Fee_Payment_Status__c,
                       Seat_Confirmed__c,
                       Department__c,
                       Department__r.Name
                FROM Admission_Enquiry__c
                WHERE Email__c = :u.Email
                ORDER BY CreatedDate DESC
                LIMIT 1

            ];

            return enqs.isEmpty() ? null : enqs[0];

        }catch(Exception e){

            throw new AuraHandledException('Unable to fetch enquiry: ' + e.getMessage());

        }

    }


    /**
     * Submit Documents
     */
    @AuraEnabled
    public static void submitDocuments(String enquiryId, List<String> docTypes){

        try{

            List<Document_Submission__c> docs = new List<Document_Submission__c>();

            for(String dtype : docTypes){

                docs.add(

                    new Document_Submission__c(

                        Admission_Enquiry__c = enquiryId,
                        Document_Type__c = dtype,
                        Submitted_On__c = Date.today()

                    )

                );

            }

            insert docs;

            update new Admission_Enquiry__c(

                Id = enquiryId,
                Admission_Status__c = 'Document Submitted'

            );

        }catch(Exception e){

            throw new AuraHandledException('Document submission failed: ' + e.getMessage());

        }

    }


    /**
     * Submit Fee Payment
     * Also reduces department seat count
     */
    @AuraEnabled
    public static void submitFeePayment(

        String enquiryId,
        String payMode,
        String payRef,
        Decimal amountPaid,
        Date payDate,
        Boolean receiptReady

    ){

        try{

            insert new Fee_Payment__c(

                Admission_Enquiry__c = enquiryId,
                Payment_Mode__c = payMode,
                Payment_Reference__c = payRef,
                Amount_Paid__c = amountPaid,
                Payment_Date__c = payDate,
                Receipt_Uploaded__c = receiptReady,
                Payment_Status__c = 'Submitted'

            );


            Admission_Enquiry__c enquiry = [

                SELECT Id,
                       Department__c
                FROM Admission_Enquiry__c
                WHERE Id = :enquiryId
                LIMIT 1

            ];


            Department__c dept = [

                SELECT Id,
                       Available_Seats__c
                FROM Department__c
                WHERE Id = :enquiry.Department__c
                LIMIT 1

            ];


            if(dept.Available_Seats__c > 0){

                dept.Available_Seats__c = dept.Available_Seats__c - 1;

                update dept;

            }


            update new Admission_Enquiry__c(

                Id = enquiryId,
                Admission_Status__c = 'Fee Paid',
                Fee_Payment_Status__c = 'Submitted',
                Seat_Confirmed__c = true

            );

        }catch(Exception e){

            throw new AuraHandledException('Payment submission failed: ' + e.getMessage());

        }

    }

}