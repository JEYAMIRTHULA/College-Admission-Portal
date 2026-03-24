import { LightningElement, track, api } from 'lwc';
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import submitDocuments from '@salesforce/apex/AdmissionController.submitDocuments';

export default class ApplicationTracker extends NavigationMixin(LightningElement) {

    @api title = 'My Application Status';
    @api showDocumentSection = false;
    @api maxDocuments = 6;
    @api showProgressBar = false;

    // Enquiry will come from parent component
    @api enquiry;

    @track docTypes = [
        { label:'10th Mark Certificate', value:'10th Certificate', submitted:false },
        { label:'12th Mark Certificate', value:'12th Certificate', submitted:false },
        { label:'Transfer Certificate', value:'Transfer Certificate', submitted:false },
        { label:'Passport Size Photo', value:'Passport Photo', submitted:false },
        { label:'Government ID Proof', value:'ID Proof', submitted:false },
        { label:'UG Degree Certificate', value:'UG Certificate', submitted:false }
    ];

    uploadedDocs = [];

    handleUploadFinished(event){

        const uploadedFiles = event.detail.files;
        const docType = event.target.dataset.type;

        if(uploadedFiles.length > 0){

            this.uploadedDocs.push(docType);

            this.docTypes = this.docTypes.map(doc => {

                if(doc.value === docType){
                    return { ...doc, submitted:true };
                }

                return doc;

            });

        }
    }

    async submitDocuments(){

        try{

            await submitDocuments({
                enquiryId : this.enquiry.Id,
                docTypes  : this.uploadedDocs
            });

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Documents submitted successfully',
                    variant: 'success'
                })
            );

        }
        catch(error){

            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Success',
                    message: 'Documents submitted successfully',
                    variant: 'error'
                })
            );

        }

    }

    // navigateToPayment(){

    //     this[NavigationMixin.Navigate]({
    //         type: 'comm__namedPage',
    //         attributes: {
    //             name: 'Fee_Payment__c'
    //         }
    //     });

    // }

}