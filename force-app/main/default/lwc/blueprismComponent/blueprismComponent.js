import { LightningElement, track, api } from 'lwc';
import getToken from '@salesforce/apex/AuthController.getToken';
import getDropdown1Options from '@salesforce/apex/ApiController.getDropdown1Options';
import getDropdown2Options from '@salesforce/apex/ApiController.getDropdown2Options';
import postRequest from '@salesforce/apex/ApiController.postRequest';
import patchRequest from '@salesforce/apex/ApiController.patchRequest';

export default class BluePrismComponent extends LightningElement {
    @api recordId;
    @track dropdown1Options;
    @track dropdown2Options;
    @track dropdown1Value;
    @track dropdown2Value;
    @track message;

    connectedCallback() {
        this.fetchToken();
    }

    fetchToken() {
        getToken()
            .then(result => {
                let token = result;
                this.fetchDropdown1Options(token);
                this.fetchDropdown2Options(token);
            })
            .catch(error => {
                console.log("Unable to connect to the Auth API.");
                console.error(error);
            });
    }

    fetchDropdown1Options(token) {
        getDropdown1Options({ token: token })
            .then(result => {
                let obj = JSON.parse(result);
                let items = obj.items;
                this.dropdown1Options = items.map(
                    ({processName: label, processId: value})=>({label, value})
                  );
            })
            .catch(error => {
                console.log("Unable to populate the Process drop-down list.");
                console.error(error);
            });
    }

    fetchDropdown2Options(token) {
        getDropdown2Options({ token: token })
            .then(result => {
                let obj = JSON.parse(result);
                let items = obj.items;
                this.dropdown2Options = items.map(
                    ({name: label, id: value})=>({label, value})
                  );
            })
            .catch(error => {
                console.log("Unable to populate the Resource drop-down list.");
                console.error(error);
            });
    }

    handleDropdown1Change(event) {
        this.dropdown1Value = event.target.value;
    }

    handleDropdown2Change(event) {
        this.dropdown2Value = event.target.value;
    }

    handleSubmit() {
        this.postRequest(this.dropdown1Value, this.dropdown2Value);
    }

    postRequest(processID, resourceID) {
        let token;
        getToken()
            .then(result => {
                token = result;
                this.message = "Session requested..";
                return postRequest({ token: token, processID: processID, resourceID: resourceID });
            })
            .then(result => {
                console.log(result);
                if(result.toString().includes('Error')){
                    this.message = result;
                }else{
                    let sessionID = result;
                    setTimeout(() => {
                        patchRequest({ token: token, sessionID: sessionID })
                            .then(result => {
                                console.log(result);
                                if(result == '202'){
                                    this.message = "Session started successfully";
                                }else{
                                    this.message = "Unable to start session: " + result;
                                }
    
                            })
                            .catch(error => {
                                this.message = "Unable to start session: " + error;
                                console.error("Can't start session - " + error);
                            });
                    }, 4000);
                    }
            })
            .catch(error => {
                this.message = "Unable to create session: " + error;
                console.error("Can't create session - " + error);
            });
    }
}