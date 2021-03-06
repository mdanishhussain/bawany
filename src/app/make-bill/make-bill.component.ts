import { Component, OnInit } from '@angular/core';
import { AngularFireDatabase, AngularFireList } from 'angularfire2/database';
import { NgForm } from '@angular/forms';
import { CustomerServiceService } from '../customer-service.service' 
import * as firebase from 'firebase';
import { DatePipe } from '@angular/common';
import { catchError } from 'rxjs/operators';

@Component({
  selector: 'app-make-bill',
  templateUrl: './make-bill.component.html',
  styleUrls: ['./make-bill.component.css']
})
export class MakeBillComponent implements OnInit {
  selected: string;
  allCustomers;
  custName = [];
  billNo;
  detailsArray = [];
  billDetailId = 0;
  currentDate;
  customerBalance;
  formatDate;
  role;
  username;
  totalAmount;
  
  constructor(public datepipe: DatePipe, public customerService:CustomerServiceService,public db: AngularFireDatabase) {

    this.role = localStorage.getItem('role');
    this.username = localStorage.getItem('username');
    console.log(this.detailsArray);
    //getting all customers
    db.list('/customers')
    .valueChanges()
    .subscribe(res => {
      this.allCustomers = res;
      for(let key in this.allCustomers){
        this.custName.push(this.allCustomers[key].customerId+"-"+this.allCustomers[key].customerName);
      }
    });
    this.currentDate = new Date();
    this.formatDate =this.datepipe.transform(this.currentDate, 'yyyy-MM-dd hh:mm:ss');

    
    
   }

  ngOnInit() {
  }


  getNewBillId(){
    let count= 0;
    for(let c in this.allCustomers){
      for(let b in this.allCustomers[c].bills ){
        count++;
      }
    }
    return ++count;
  }


  async createBill(custBill:NgForm){
    this.billNo=this.getNewBillId();
    if(custBill.value.customer != "" && custBill.value.qty != "" && custBill.value.product != "" && custBill.value.rate != ""){
      this.detailsArray.push({serial: this.billDetailId, than:custBill.value.than, product:custBill.value.product, quantity:custBill.value.qty,
                             rate:custBill.value.rate, subtotal:(custBill.value.qty * custBill.value.rate)});
      this.billDetailId++;
      console.log(this.detailsArray);
      this.totalAmount = 0;
      for(let d of this.detailsArray){
        this.totalAmount += d.subtotal
      }
    }
    else{
      alert("Field Missing");
    }
  }

  async deleteRow(id){
    let valueCount:number =0;
    let detailID:number =0;
    
    this.detailsArray = this.detailsArray.filter(function( obj ) {
      detailID=obj. serial
      return obj.serial !== id;
    });
    this.totalAmount = 0;
      for(let d of this.detailsArray){
        this.totalAmount += d.subtotal
      }
  }


  async finalBill(){
    let custKey: any;
    let id="";
    let custId=0;
    let bills;
    //getting bill ID
    this.billNo=this.getNewBillId();

    if(this.detailsArray != null){
      bills = {billDate: this.formatDate, billid: this.billNo, totalAmount: this.totalAmount, billDetail: this.detailsArray};
      //get Customer ID
      for(let i=0;i<this.selected.length;i++){
        if(this.selected[i]!= '-'){
          id+=this.selected[i];
        }
        else if(this.selected[i]== '-'){
          break;
        }
      }
      custId= +id;
      console.log(custId+"-"+id);
      if(!isNaN(custId)){
          
          //custId= +id; //parse into Int
          this.customerBalance = this.getBalance(custId); //get balance to update it
          console.log(this.customerBalance);
          this.customerBalance += this.totalAmount;
          custKey = this.getCustomerKey(custId); //get Customer Key

      }
      else{
        alert("sadas");
        let count = 0;
        for (var key in this.allCustomers) { // fetching bookings for the users                   
          count=this.allCustomers[key].customerId;
          count++;
        }
        if(count == 0){
          count = 1;
        }

        this.db.list('/customers').push({
          customerId: count,
          title:"",
          customerName: this.selected,
          customerContact: "",
          customerAddress: "",
          reference: "",
          balance:this.totalAmount,  
          addedBy: this.username,
          addDate: this.formatDate,
        });
        console.log(count);
        custKey = this.getCustomerKey(count);
      }
      
      try{
        console.log(custKey);
        firebase.database().ref('/customers/'+custKey).child("bills").push(bills); //push bill
        this.db.object('customers/' + custKey).update({balance: this.customerBalance}); //update balance
      }catch(error){
        console.log(error);
        // let count = 0;
        // for (var key in this.allCustomers) { // fetching bookings for the users                   
        //   count=this.allCustomers[key].customerId;
        //   count++;
        // }
        // if(count == 0){
        //   count = 1;
        // }

        // this.db.list('/customers').push({
        //   customerId: count,
        //   title:"",
        //   customerName: this.selected,
        //   customerContact: "",
        //   customerAddress: "",
        //   reference: "",
        //   balance:this.customerBalance,  
        //   addedBy: this.username,
        //   addDate: this.formatDate,
        // });
        // console.log(count);
        // custKey = this.getCustomerKey(count); //get Customer Key
        // this.finalBill();

      }
      
      

    }
    location.reload();
  }


  getCustomerKey(id){
    let data$;
    this.db.database.ref('customers').orderByChild('customerId').equalTo(id).on("value", function(snapshot) {
      console.log(snapshot.val());
      snapshot.forEach(function(data) {
          console.log(data.key);
          data$ = data.key;
      });
    });
    return data$;
  }

  getBalance(id){
    for(let c of this.allCustomers){
      if(c.customerId == id){
        console.log(c.customerId + " == " + id);
        console.log(c.balance);
        return c.balance;
      }
    }
    return 0;
  }
  

}
