import { LightningElement, wire, track, api } from 'lwc';
import getDepartments from '@salesforce/apex/AdmissionController.getDepartments';
import submitEnquiry from '@salesforce/apex/AdmissionController.submitEnquiry';

export default class EnquiryForm extends LightningElement {

    @api title = 'Admission Enquiry Form';
    @api submitButtonLabel = 'Submit Enquiry';
    // Exposed boolean property required by .js-meta.xml
    // Must default to false per LWC guidelines
    @api showUGField = false;

    @track deptId = '';
    @track studentName = '';
    @track email = '';
    @track mobile = '';
    @track dob = '';
    @track aadhaar = '';

    @track tenth;
    @track twelfth;
    @track ugPercent;

    @track isSubmitted = false;
    @track enquiryNumber = '';
    @track isEligible = false;
    @track errorMessage = '';
    @track isLoading = false;

    deptOptions = [];
    allDepts = [];

    @wire(getDepartments)
    wiredDepts({ data }) {
        if (data) {

            this.allDepts = data;

            this.deptOptions = data.map(d => ({
                label: d.Name + ' (' + d.Programme_Type__c + ')',
                value: d.Id
            }));

        }
    }

    // Show UG field when either admin forces it via property OR selected department is PG
    get isPG() {
        if (this.showUGField) {
            return true;
        }
        if (!this.deptId || !this.allDepts || this.allDepts.length === 0) {
            return false;
        }
        const selected = this.allDepts.find(d => d.Id === this.deptId);
        return selected ? (selected.Programme_Type__c === 'PG') : false;
    }

    handleDept(e) { this.deptId = e.detail.value; }
    handleName(e) { this.studentName = e.detail.value; }
    handleEmail(e) { this.email = e.detail.value; }
    handleMobile(e) { this.mobile = e.detail.value; }
    handleDob(e) { this.dob = e.detail.value; }

    handleAadhaar(e) {
        this.aadhaar = e.target.value;
        console.log('AADHAAR VALUE', this.aadhaar);
    }

    handleTenth(e) { this.tenth = parseFloat(e.target.value); }
    handleTwelfth(e) { this.twelfth = parseFloat(e.target.value); }
    handleUG(e) { this.ugPercent = parseFloat(e.target.value); }

    async handleSubmit() {

        this.errorMessage = '';

        if (!this.deptId || !this.studentName || !this.email || !this.aadhaar) {
            this.errorMessage = 'Please fill all required fields';
            return;
        }

        this.isLoading = true;

        try {

            const result = await submitEnquiry({

                deptId: this.deptId,
                studentName: this.studentName,
                email: this.email,
                mobile: this.mobile,
                dob: this.dob,
                aadharNumber: this.aadhaar,
                tenth: this.tenth,
                twelfth: this.twelfth,
                ugPercent: this.ugPercent

            });

            this.enquiryNumber = result.Name;
            this.isEligible = result.Is_Eligible__c;
            this.isSubmitted = true;

        }
        catch(err) {

            this.errorMessage = err.body.message;

        }
        finally {

            this.isLoading = false;

        }
    }

}
