import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import OrderForm from './OrderForm';
import OrderForm2 from './OrderForm2';

function App() {
  return (
    <Router>
      <div className="app-container">
        <h1>Stock Loan Portal</h1>
        <Routes>
          <Route path="/" element={<OrderForm />} />
          <Route path="/orderform2" element={<OrderForm2 />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
