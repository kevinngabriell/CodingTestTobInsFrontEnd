import React, { useEffect, useState } from 'react';
import '../page/style.css';
import { formatDate } from '../App';

function Home() {
    const [policies, setPolicies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showViewModal, setShowViewModal] = useState(false);
    const [showEditModal, setShowEditModal] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [selectedPolicy, setSelectedPolicy] = useState(null);
    const [carBrands, setCarBrands] = useState([]);
    const [carTypes, setCarTypes] = useState([]);
    const [rates, setRates] = useState([]);
    const [formData, setFormData] = useState({
        policy_number: '',
        insured: '',
        effective_date: '',
        expiration_date: '',
        car_brand: '',
        car_type: '',
        car_year: new Date().getFullYear(),
        car_price: '',
        premium_rate: '',
        premium_price: ''
    });
    const [errors, setErrors] = useState({});

    useEffect(() => {
        fetch('https://www.kevinngabriell.com/tobInsAPI-v.1.0/insurance/insurance.php')
            .then(response => response.json())
            .then(data => {
                if (data.StatusCode === 200) {
                    setPolicies(data.Data);
                } else {
                    console.error("Failed to fetch data:", data.Status);
                }
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching data:", error);
                setLoading(false);
            });
    }, []);

    useEffect(() => {
        fetch('https://www.kevinngabriell.com/tobInsAPI-v.1.0/car/carbrand.php')
            .then(response => response.json())
            .then(data => setCarBrands(data.Data || []));

        fetch('https://www.kevinngabriell.com/tobInsAPI-v.1.0/rate/rate.php')
            .then(response => response.json())
            .then(data => setRates(data.Data || []));
    }, []);

    // Fetch new policy number from API
    const fetchNewPolicyNumber = () => {
        fetch('https://www.kevinngabriell.com/tobInsAPI-v.1.0/insurance/newpolicynumber.php')
            .then(response => response.json())
            .then(data => {
                if (data.StatusCode === 200) {
                    setFormData(prev => ({ ...prev, policy_number: data.Data.policy_number }));
                } else {
                    console.error("Failed to fetch new policy number:", data.Status);
                }
            })
            .catch(error => {
                console.error("Error fetching new policy number:", error);
            });
    };

    // Open Add Modal and fetch new policy number
    const openAddModal = () => {
        setFormData({
            policy_number: '',
            effective_date: '',
            expiration_date: '',
            car_brand: '',
            car_type: '',
            car_year: new Date().getFullYear(),
            car_price: '',
            premium_rate: '',
            premium_price: ''
        });
        setShowAddModal(true);
        fetchNewPolicyNumber(); // Fetch a new policy number when modal is opened
    };

    // Fetch Car Types based on selected car brand
    const fetchCarTypes = (brandId) => {
        fetch(`https://www.kevinngabriell.com/tobInsAPI-v.1.0/car/cartype.php?brand=${brandId}`)
            .then(response => response.json())
            .then(data => {
                // Check if `Data` is an array, otherwise convert it to an array
                const carTypeData = Array.isArray(data.Data) ? data.Data : [data.Data];
                setCarTypes(carTypeData);
            })
            .catch(error => {
                console.error("Error fetching car types:", error);
                setCarTypes([]); // Fallback to empty array in case of error
            });
    };

    // Handle input changes and calculations
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setErrors(prev => ({ ...prev, [name]: '' }));
    
        // Recalculate premium price if car_price or premium_rate changes
        if (name === 'car_price' || name === 'premium_rate') {
            // Remove any commas from car_price for calculation
            const carPrice = parseFloat((formData.car_price || "0").replace(/[^0-9]/g, ''));
            const containsAlphabetic = (str) => /[a-zA-Z]/.test(str);

            if(!containsAlphabetic(formData.premium_rate) && formData.premium_rate != 0){
                const premium = carPrice * (formData.premium_rate / 100);
                setFormData(prev => ({
                    ...prev,
                    premium_price: premium.toLocaleString('id-ID') // Format with commas for thousands
                }));
            } else {
                const selectedRate = rates.find(rate => rate.uid === formData.premium_rate);
                const rateValue = selectedRate ? parseFloat(selectedRate.rate) : 0;
                
                const premium = carPrice * (rateValue / 100);

                setFormData(prev => ({
                    ...prev,
                    premium_price: premium // Format with commas for thousands
                }));
            }
        }
    };
    
    // Format car price with commas
    const formatCarPrice = (e) => {
        const value = e.target.value.replace(/\D/g, ''); // Remove non-numeric characters
        const formattedValue = value ? parseInt(value).toLocaleString('id-ID') : ''; // Format with commas for thousands
    
        // Set the formatted car_price in formData
        setFormData(prev => ({ ...prev, car_price: formattedValue }));
    
        // Parse car_price as a number for calculation
        const carPriceNumber = parseFloat(value) || 0;
    
        // Fetch the actual rate value based on the selected premium_rate UID
        const selectedRate = rates.find(rate => rate.uid === formData.premium_rate);
        const rateValue = selectedRate ? parseFloat(selectedRate.rate) : 0;
    
        // Calculate premium price based on car price and rate value
        const premium = carPriceNumber * (rateValue / 100);
    
        // Update premium_price in formData
        setFormData(prev => ({
            ...prev,
            premium_price: premium
        }));
    };
    

    // Show delete confirmation dialog
    const handleDelete = (policy) => {
        setSelectedPolicy(policy);
        setShowDeleteConfirm(true);
    };

    const confirmDelete = () => {
        const apiUrl = 'https://www.kevinngabriell.com/tobInsAPI-v.1.0/insurance/insurance.php';
    
        // Prepare the data to be sent as raw JSON
        const requestData = {
            policy_number: selectedPolicy.policy_number
        };
    
        fetch(apiUrl, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.StatusCode === 200) {
                setShowDeleteConfirm(false); 
                window.location.reload();
            } else {
                alert("Failed to delete policy: " + data.Message);
            }
        })
        .catch(error => {
            console.error("Error deleting policy:", error);
            alert("An error occurred while deleting the policy.");
        });
    };

    const confirmAdd = () => {
        console.log('Submitting new policy:', formData);
    
        // Define the API URL
        const apiUrl = 'https://www.kevinngabriell.com/tobInsAPI-v.1.0/insurance/insurance.php';

        const cleanData = {
            ...formData,
            car_price: formData.car_price.replace(/\./g, ''), // Remove dots
            premium_price: formData.premium_price.replace(/\./g, ''), // Remove dots
        };
    
        const formBody = new URLSearchParams({
            policy_number: cleanData.policy_number,
            insured: 'cfac7109-a1cc-11ef-8335-bc241190257c',
            effective_date: cleanData.effective_date,
            expiration_date: cleanData.expiration_date,
            car_brand: cleanData.car_brand,
            car_type: cleanData.car_type,
            car_year: cleanData.car_year,
            car_price: cleanData.car_price,
            premium_rate: '6734c3bf743e00.23625388',
            premium_price: cleanData.premium_price,
            created_by: 'cfac7109-a1cc-11ef-8335-bc241190257c'
        });
    
        // Perform the POST request
        fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: formBody.toString() // Send as x-www-form-urlencoded
        })
        .then(response => response.json())
        .then(data => {
            if (data.StatusCode === 201) {
                console.log("Policy created successfully:", data.Message);
                setPolicies([...policies, formData]);
                setFormData({
                    policy_number: '',
                    effective_date: '',
                    expiration_date: '',
                    car_brand: '',
                    car_type: '',
                    car_year: new Date().getFullYear(),
                    car_price: '',
                    premium_rate: '',
                    premium_price: ''
                });
                setShowAddModal(false);
            } else {
                console.error("Failed to create policy:", data.Message);
                alert("Failed to create policy: " + data.Message);
            }
        })
        .catch(error => {
            console.error("Error creating policy:", error);
            alert("An error occurred while creating the policy.");
        });
    };

    const confirmUpdate = () => {
        console.log('Updating policy:', formData);
    
        const apiUrl = 'https://www.kevinngabriell.com/tobInsAPI-v.1.0/insurance/insurance.php';
        const cleanData = {
            ...formData,
            car_price: String(formData.car_price).replace(/\./g, ''), // Ensure car_price is a string before replacing dots
            premium_price: String(formData.premium_price).replace(/\./g, ''), // Ensure premium_price is a string before replacing dots
        
            updated_by: 'cfac7109-a1cc-11ef-8335-bc241190257c'  // Provide a valid user ID here
        };
    
        // Prepare data as JSON for the PUT request
        fetch(apiUrl, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(cleanData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.StatusCode === 200) {
                console.log("Policy updated successfully:", data.Message);
                setPolicies(policies.map(policy =>
                    policy.policy_number === formData.policy_number ? formData : policy
                ));
                setShowEditModal(false);
            } else {
                console.error("Failed to update policy:", data.Message);
                alert("Failed to update policy: " + data.Message);
            }
        })
        .catch(error => {
            console.error("Error updating policy:", error);
            alert("An error occurred while updating the policy.");
        });
    };


    // Open View Modal and fetch policy data
    const openViewModal = (policyNumber) => {
        fetch(`https://www.kevinngabriell.com/tobInsAPI-v.1.0/insurance/insurance.php?policy_number=${policyNumber}`)
            .then(response => response.json())
            .then(data => {
                if (data.StatusCode === 200) {
                    const { car_name, ...otherData } = data.Data;
                    
                    // Split car_name into merek and tipe
                    const [merek, tipe] = car_name.split(" - ");
                    
                    setSelectedPolicy({ ...otherData, merek, tipe });
                    setShowViewModal(true);
                }
            })
            .catch(error => console.error("Error fetching policy:", error));
    };

    // Open Edit Modal and fetch policy data
    const openEditModal = (policyNumber) => {
        fetch(`https://www.kevinngabriell.com/tobInsAPI-v.1.0/insurance/insurance.php?policy_number=${policyNumber}`)
            .then(response => response.json())
            .then(data => {
                if (data.StatusCode === 200) {
                    const { 
                        policy_number, insured, effective_date, expiration_date, 
                        car_name, car_price, car_year, premium_price, premium_rate, 
                        car_brand_uid, car_type_uid, premium_rate_uid 
                    } = data.Data;

                    // Split car_name into brand and type
                    const [merek, tipe] = car_name.split(" - ");

                    // Set form data based on response
                    setFormData({
                        policy_number,
                        insured,
                        effective_date,
                        expiration_date,
                        car_brand: car_brand_uid,
                        car_type: car_type_uid,
                        car_year,
                        car_price,
                        premium_rate: premium_rate_uid,
                        premium_price
                    });

                    fetchCarTypes(car_brand_uid); // Fetch types based on selected brand
                    setShowEditModal(true);
                }
            })
            .catch(error => console.error("Error fetching policy:", error));
    };

    // Handle form input changes and validate fields
    // const handleInputChange = (e) => {
    //     const { name, value } = e.target;
    //     setFormData(prev => ({ ...prev, [name]: value }));
    //     setErrors(prev => ({ ...prev, [name]: '' })); // Clear error when field changes
    // };

    // Validate required fields and date range
    const validateForm = () => {
        const newErrors = {};
        const requiredFields = ['insured', 'effective_date', 'expiration_date', 'car_brand', 'car_type', 'car_year', 'car_price', 'premium_rate', 'premium_price'];

        requiredFields.forEach(field => {
            if (!formData[field]) newErrors[field] = 'This field is required';
        });

        const effectiveDate = new Date(formData.effective_date);
        const expirationDate = new Date(formData.expiration_date);
        if (expirationDate <= effectiveDate) {
            newErrors.expiration_date = 'Masa pertanggungan kurang dari 1 tahun';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit form for adding a policy
    const submitAddPolicy = () => {
        if (validateForm()) {
            // Submit data to the server (implement the actual POST request here)
            console.log("Submitting new policy:", formData);
            setShowAddModal(false);
        }
    };

    return (
        <div id="home">
            <div className="header">
                <h1>List Polis Asuransi</h1>
                <button onClick={openAddModal} className="add-button">Tambah Polis</button>
            </div>

            {loading ? (
                <p>Loading...</p>
            ) : (
                <table className="policy-table">
                    <thead>
                        <tr>
                            <th>Nomor Polis</th>
                            <th>Nama Tertanggung</th>
                            <th>Periode</th>
                            <th>Nama Item</th>
                            <th>Harga Pertanggungan</th>
                            <th>Harga Premi</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {policies.map((policy, index) => (
                            <tr key={index}>
                                <td>{policy.policy_number}</td>
                                <td>{policy.insured}</td>
                                <td>{formatDate(policy.effective_date)} - {formatDate(policy.expiration_date)}</td>
                                <td>{policy.car_name} ({policy.car_year})</td>
                                <td>Rp {parseInt(policy.car_price).toLocaleString('id-ID')}</td>
                                <td>Rp {parseInt(policy.premium_price).toLocaleString('id-ID')}</td>
                                <td>
                                    <div className="dropdown">
                                        <button className="dots-button">⋮</button>
                                        <div className="dropdown-content">
                                            <span onClick={() => openViewModal(policy.policy_number)}>View</span>
                                            <span onClick={() => openEditModal(policy.policy_number)}>Edit</span>
                                            <span onClick={() => handleDelete(policy)}>Delete</span>
                                        </div>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}

            {/* Add Policy Modal */}
            {showAddModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowAddModal(false)}>&times;</span>
                        <h2 className='headerTextFormAdd'>Tambah Polis Baru</h2>
                        <form className='formAddPolis'>
                            <div className='formAddPolisDetail'>
                                <label>Nomor Polis</label>
                                <input type="text" value={formData.policy_number} readOnly />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Nama Tertanggung</label>
                                <input type="text" name="insured" value={formData.insured} onChange={handleInputChange} placeholder='Masukkan nama tertanggung'/>
                                {errors.insured && <p className="error">{errors.insured}</p>}
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tanggal Efektif</label>
                                <input type="date" name="effective_date" value={formData.effective_date} onChange={handleInputChange} />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tanggal Expired</label>
                                <input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleInputChange} />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Merek Kendaraan</label>
                                <select name="car_brand" onChange={(e) => { handleInputChange(e); fetchCarTypes(e.target.value); }}>
                                    <option value="">Pilih Merek</option>
                                    {carBrands.map(brand => <option key={brand.uid} value={brand.uid}>{brand.car_brand_name}</option>)}
                                </select>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tipe Kendaraan</label>
                                <select name="car_type" value={formData.car_type} onChange={handleInputChange}>
                                    <option value="">Pilih Tipe</option>
                                    {carTypes.map(type => <option key={type.uid} value={type.uid}>{type.name}</option>)}
                                </select>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tahun Kendaraan</label>
                                <select name="car_year" value={formData.car_year} onChange={handleInputChange}>
                                    {[...Array(new Date().getFullYear() - 1990 + 1)].map((_, i) => {
                                        const year = 1990 + i;
                                        return <option key={year} value={year}>{year}</option>;
                                    })}
                                </select>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Harga Kendaraan</label>
                                <input type="text" name="car_price" value={formData.car_price} onChange={formatCarPrice} />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Rate Premi</label>
                                <select name="premium_rate" value={formData.premium_rate} onChange={handleInputChange}>
                                    <option value="">Pilih Rate</option>
                                    {rates.map(rate => <option key={rate.uid} value={rate.rate}>{rate.rate}%</option>)}
                                </select>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Harga Premi</label>
                                <input type="text" value={formData.premium_price} readOnly />
                            </div>
                        </form>
                        <div className="modal-actions" style={{ marginTop: '5%' }}>
                            <span onClick={confirmAdd} className="AddAction">Tambah</span>
                            <span onClick={() => setShowAddModal(false)} className="CancelAction">Batal</span>
                        </div>
                    </div>
                </div>
            )}

            {/* View Policy Modal */}
            {showViewModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowViewModal(false)}>&times;</span>
                        <h2 className='headerTextFormAdd'>Lihat Polis</h2>
                        <form className='formAddPolis'>
                            <div className='formAddPolisDetail'>
                                <label>Nomor Polis</label>
                                <input type="text" value={selectedPolicy.policy_number} readOnly />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Nama Tertanggung</label>
                                <input type="text" name="insured" value={selectedPolicy.insured} placeholder='Masukkan nama tertanggung'/>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tanggal Efektif</label>
                                <input type="date" name="effective_date" value={selectedPolicy.effective_date}/>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tanggal Expired</label>
                                <input type="date" name="expiration_date" value={selectedPolicy.expiration_date}/>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Merek Kendaraan</label>
                                <input type="text" name="car_name" value={selectedPolicy.merek}/>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tipe Kendaraan</label>
                                <input type="text" name="car_name" value={selectedPolicy.tipe}/>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tahun Kendaraan</label>
                                <input type="text" name="car_year" value={selectedPolicy.car_year}/>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Harga Kendaraan</label>
                                <input type="text" name="car_price" value={`Rp ${parseInt(selectedPolicy.car_price).toLocaleString('id-ID')}`}  />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Rate Premi</label>
                                <input type="text" name="premium_rate" value={`${selectedPolicy.premium_rate} %`}/>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Harga Premi</label>
                                <input type="text" value={`Rp ${parseInt(selectedPolicy.premium_price).toLocaleString('id-ID')}`} readOnly />
                            </div>
                        </form>
                        <div className="modal-actions" style={{ marginTop: '5%' }}>
                            <span onClick={() => setShowViewModal(false)} className="CancelAction">Tutup</span>
                        </div>
                        {/* Form in read-only mode */}
                    </div>
                </div>
            )}

            {/* Edit Policy Modal */}
            {showEditModal && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowEditModal(false)}>&times;</span>
                        <h2 className='headerTextFormAdd'>Edit Polis</h2>
                        <form className='formAddPolis'>
                            <div className='formAddPolisDetail'>
                                <label>Nomor Polis</label>
                                <input type="text" value={formData.policy_number} readOnly />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Nama Tertanggung</label>
                                <input type="text" name="insured" value={formData.insured} onChange={handleInputChange} />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tanggal Efektif</label>
                                <input type="date" name="effective_date" value={formData.effective_date} onChange={handleInputChange} />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tanggal Expired</label>
                                <input type="date" name="expiration_date" value={formData.expiration_date} onChange={handleInputChange} />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Merek Kendaraan</label>
                                <select name="car_brand" value={formData.car_brand} onChange={(e) => { handleInputChange(e); fetchCarTypes(e.target.value); }}>
                                    <option value="">Pilih Merek</option>
                                    {carBrands.map(brand => (
                                        <option key={brand.uid} value={brand.uid}>{brand.car_brand_name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tipe Kendaraan</label>
                                <select name="car_type" value={formData.car_type} onChange={handleInputChange}>
                                    <option value="">Pilih Tipe</option>
                                    {carTypes.map(type => (
                                        <option key={type.uid} value={type.uid}>{type.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Tahun Kendaraan</label>
                                <select name="car_year" value={formData.car_year} onChange={handleInputChange}>
                                    {[...Array(new Date().getFullYear() - 1990 + 1)].map((_, i) => {
                                        const year = 1990 + i;
                                        return <option key={year} value={year}>{year}</option>;
                                    })}
                                </select>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Harga Kendaraan</label>
                                <input 
                                    type="text" 
                                    name="car_price" 
                                    value={formData.car_price ? `Rp ${formData.car_price}` : ''} 
                                    onChange={formatCarPrice} 
                                />
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Rate Premi</label>
                                <select name="premium_rate" value={formData.premium_rate} onChange={handleInputChange}>
                                    <option value="">Pilih Rate</option>
                                    {rates.map(rate => (
                                        <option key={rate.uid} value={rate.uid}>{rate.rate}%</option>
                                    ))}
                                </select>
                            </div>
                            <div className='formAddPolisDetail'>
                                <label>Harga Premi</label>
                                <input type="text" value={`Rp ${parseInt(formData.premium_price).toLocaleString('id-ID')}`} readOnly />
                            </div>
                        </form>
                        <div className="modal-actions" style={{ marginTop: '5%' }}>
                            <span onClick={confirmUpdate} className="AddAction">Update</span>
                            <span onClick={() => setShowEditModal(false)} className="CancelAction">Tutup</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteConfirm && (
                <div className="modal">
                    <div className="modal-content">
                        <span className="close" onClick={() => setShowDeleteConfirm(false)}>&times;</span>
                        <h3>Apakah anda yakin akan menghapus polis ini?</h3>
                        <p>Nomor Polis: {selectedPolicy?.policy_number}</p>
                        <div className="modal-actions">
                            <span onClick={confirmDelete} className="DeleteAction">Hapus</span>
                            <span onClick={() => setShowDeleteConfirm(false)} className="CancelAction">Batal</span>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default Home;