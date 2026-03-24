import { LightningElement, track } from 'lwc';
import searchEnquiry from '@salesforce/apex/AdmissionController.searchEnquiry';

export default class SearchApplication extends LightningElement {

    enquiryNumber = '';
    aadharNumber = '';

    @track enquiry;
    @track showTracker = false;
    @track errorMessage = '';

    handleEnquiry(event){
        this.enquiryNumber = event.target.value;
    }

    handleAadhar(event){
        this.aadharNumber = event.target.value;
    }

    async handleSearch(){

        this.errorMessage = '';
        this.showTracker = false;

        try{

            const result = await searchEnquiry({

                enquiryNumber : this.enquiryNumber,
                aadharNumber  : this.aadharNumber

            });

            this.enquiry = result;
            this.showTracker = true;

        }
        catch(error){

            this.errorMessage =
                error.body ? error.body.message : 'Application not found';

        }

    }

}