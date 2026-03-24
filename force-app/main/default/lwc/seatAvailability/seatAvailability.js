import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getDepartments from '@salesforce/apex/AdmissionController.getDepartments';
import { refreshApex } from '@salesforce/apex';

export default class SeatAvailability extends NavigationMixin(LightningElement) {

    @track isLoading = true;

    departments = { data: undefined, error: undefined };

    wiredDeptResult;

    @wire(getDepartments)
    wiredDepts(result) {

        this.wiredDeptResult = result;

        const { data, error } = result;

        this.isLoading = false;

        if (data) {

            const mapped = data.map(d => ({
                ...d,
                hasSeats: Number(d.Available_Seats__c || 0) > 0
            }));

            this.departments = { data: mapped, error: undefined };

        }

        else if (error) {

            this.departments = { data: undefined, error };

        }

    }


    handleCheckEligibility(event) {

        const deptId = event.currentTarget.dataset.id;

        this[NavigationMixin.Navigate]({

            type: 'comm__namedPage',

            attributes: {
                name: 'Eligibility_Check__c'
            },

            state: {
                deptId: deptId
            }

        });

    }


    // 🔽 REFRESH SEATS

    refreshSeats(){

        refreshApex(this.wiredDeptResult);

    }

}