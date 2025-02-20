import React, { useState } from 'react';
import './OrderForm.css';
import { Link } from 'react-router-dom';

const OrderForm = () => {
    const [companyName, setCompanyName] = useState("");
    const [quantity, setQuantity] = useState("");
    const [orderType, setOrderType] = useState("BUY");

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log("Order Submitted", {
            companyName,
            quantity,
            orderType,
        });

        setCompanyName("");
        setQuantity("");
        setOrderType("BUY");
    };

    return (
        <div className='form-container'>
            <h2> Order Form</h2>
            <form onSubmit={handleSubmit}>
                <label>Company Name:</label>
                <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="Enter Company Name"
                />
                <br/>

                <label>Quantity</label>
                <input 
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    placeholder="Enter Stock Quantity"
                />
                <br/>

                <label>Order Type</label>
                <select
                    value={orderType}
                    onChange={(e) => setOrderType(e.target.value)}
                >
                    <option value='BUY'>BUY</option>
                    <option value='SELL'>SELL</option>
                    <option value='ENQUIRE'>ENQUIRE</option>
                </select>
                <br/>

                <button 
                    type="submit"
                    className="submit-button"
                > SUBMIT</button>
            </form>
            <Link to="/orderform2" className="link-button">Hello World Page</Link>
        </div>
    );
};

export default OrderForm;
