import { LightningElement, wire, track } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import getDepartments from '@salesforce/apex/AdmissionController.getDepartments';

export default class EligibilityChecker extends NavigationMixin(LightningElement) {
    @track selectedDeptId = '';
    @track tenth = null;
    @track twelfth = null;
    @track ugPercent = null;
    @track resultShown = false;
    @track isEligible = false;
    @track resultMessage = '';
    @track isPG = false;
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

    handleDeptChange(e) {
        this.selectedDeptId = e.detail.value;
        const dept = this.allDepts.find(d => d.Id === this.selectedDeptId);
        this.isPG = dept && dept.Programme_Type__c === 'PG';
        this.resultShown = false;
    }
    handleTenth(e)   { this.tenth     = parseFloat(e.detail.value); }
    handleTwelfth(e) { this.twelfth   = parseFloat(e.detail.value); }
    handleUG(e)      { this.ugPercent = parseFloat(e.detail.value); }

    checkEligibility() {
        const dept = this.allDepts.find(d => d.Id === this.selectedDeptId);
        if (!dept) return;
        let eligible;
        if (dept.Programme_Type__c === 'PG') {
            eligible = this.tenth     >= dept.Grade_10th_Percentage__c &&
                       this.twelfth   >= dept.Grade_12th_Percentage__c &&
                       this.ugPercent >= dept.UG_Percentage__c;
        } else {
            eligible = this.tenth   >= dept.Grade_10th_Percentage__c &&
                       this.twelfth >= dept.Grade_12th_Percentage__c;
        }
        this.isEligible    = eligible;
        this.resultShown   = true;
        this.resultMessage = eligible
            ? 'Congratulations! You are eligible for ' + dept.Name + '. Click Apply Now to proceed.'
            : 'Sorry, you do not meet the eligibility criteria for ' + dept.Name +
              '. Required: 10th >= ' + dept.Grade_10th_Percentage__c + '%' +
              ', 12th >= ' + dept.Grade_12th_Percentage__c + '%' +
              (dept.Programme_Type__c === 'PG' ? ', UG >= ' + dept.UG_Percentage__c + '%' : '') + '.';
    }

    get resultClass() {
        return this.isEligible ? 'result-box eligible' : 'result-box not-eligible';
    }

    handleApply() {
        this[NavigationMixin.Navigate]({
            type: 'comm__namedPage',
            attributes: { name: 'Enquiry_Form__c' },
            state: { deptId: this.selectedDeptId }
        });
    }
}

