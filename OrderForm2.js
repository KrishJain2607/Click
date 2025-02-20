import React from 'react';
import { Link } from 'react-router-dom';
import './OrderForm.css';

const OrderForm2=()=>{
    return(
        <div className='form-container'>
            <h1>Hello World</h1>
            <Link to='/' className='link-button'>Order Form Page</Link>
        </div>
    )
}
export default OrderForm2