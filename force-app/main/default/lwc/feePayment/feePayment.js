import { LightningElement, track, api } from 'lwc';
import submitFeePayment from '@salesforce/apex/AdmissionController.submitFeePayment';
import Id from '@salesforce/user/Id';
import getMyEnquiry from '@salesforce/apex/AdmissionController.getMyEnquiry';

export default class FeePayment extends LightningElement {
    // Exposed design properties referenced in meta.xml
    @api title = 'Fee Payment';
    @api submitButtonLabel = 'Submit Payment Details';
    // Per LWC1503, Boolean public properties should default to false
    @api showAmountDue = false;
    @api allowCashPayment = false;
    @api confirmationMessage = 'Payment details submitted successfully. Awaiting admin verification.';
    @track payMode = ''; @track payRef = ''; @track amountPaid = null;
    @track payDate = ''; @track receiptReady = false;
    @track isLoading = false; @track isSubmitted = false;
    @track errorMessage = ''; @track enquiryId = '';
    @track enquiryFee = '';
    userId = Id;

    modeOptions = [
        { label:'Online Transfer / UPI', value:'Online' },
        { label:'Demand Draft',          value:'Demand Draft' },
        { label:'Cash',                  value:'Cash' }
    ];

    connectedCallback() { this.loadEnquiry(); }

    async loadEnquiry() {
        try {
            const enq = await getMyEnquiry({ userId: this.userId });
            if (enq) {
                this.enquiryId  = enq.Id;
                this.enquiryFee = enq.Department__r ? enq.Department__r.Annual_Fees__c : '';
            }
        } catch(err) { console.error(err); }
    }

    handleMode(e)    { this.payMode    = e.detail.value; }
    handleRef(e)     { this.payRef     = e.detail.value; }
    handleAmount(e)  { this.amountPaid = parseFloat(e.detail.value); }
    handleDate(e)    { this.payDate    = e.detail.value; }
    handleReceipt(e) { this.receiptReady = e.detail.checked; }

    async handleSubmit() {
        if (!this.payRef || !this.amountPaid || !this.payDate) {
            this.errorMessage = 'Please fill all required payment fields.';
            return;
        }
        this.isLoading = true;
        try {
            await submitFeePayment({
                enquiryId:    this.enquiryId,
                payMode:      this.payMode,
                payRef:       this.payRef,
                amountPaid:   this.amountPaid,
                payDate:      this.payDate,
                receiptReady: this.receiptReady
            });
            this.isSubmitted = true;
        } catch(err) {
            this.errorMessage = err.body ? err.body.message : 'Submission failed.';
        } finally {
            this.isLoading = false;
        }
    }
}
