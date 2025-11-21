

import React, { useState } from "react";
import "./RequestResource.css"; // Create appropriate styles

const RequestResource = () => {
  const [resourceName, setResourceName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [images, setImages] = useState([]);

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    setImages([...images, ...files]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const formData = new FormData();

    formData.append("resourceName", resourceName);
    formData.append("quantity", quantity);
    formData.append("category", category === "others" ? customCategory : category);
    formData.append("description", description);
    formData.append("location", location);
    formData.append("userId", localStorage.getItem("user_id"));  // Ensure the user ID is stored and retrieved correctly

    // Append image files
    images.forEach((image) => {
      formData.append("images", image);
    });

    try {
      const response = await fetch("http://localhost:5000/request-resource", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        alert("Request submitted successfully!");
        console.log("Donation submitted successfully:", result);
        // Reset the form
        setResourceName("");
        setQuantity("");
        setCategory("");
        setCustomCategory("");
        setDescription("");
        setLocation("");
        setImages([]);
      } else {
        console.error("Error during donation:", result.message);
        alert(`Error: ${result.message}`);
      }
    } catch (error) {
      console.error("Error submitting donation:", error);
      alert("An error occurred while submitting the donation.");
    }
  };

  return (
    <div className="donate-resource-container">
      <h2>Request Resource</h2>
      <form className="donate-resource-form" onSubmit={handleSubmit} enctype="multipart/form-data">
        <div className="form-section">
          <div className="form-left">
            <div className="form-group">
              <label htmlFor="resourceName">Resource Name</label>
              <input
                type="text"
                id="resourceName"
                className="input"
                placeholder="Enter the resource name"
                value={resourceName}
                onChange={(e) => setResourceName(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="quantity">Quantity</label>
              <input
                type="number"
                id="quantity"
                className="input"
                placeholder="How many units?"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                className="input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
              >
                <option value="">Select a category</option>
                <option value="food">Food</option>
                <option value="clothes">Clothes</option>
                <option value="education">Education</option>
                <option value="others">Others</option>
              </select>
            </div>

            {category === "others" && (
              <div className="form-group">
                <label htmlFor="customCategory">Custom Category</label>
                <input
                  type="text"
                  id="customCategory"
                  className="input"
                  placeholder="Specify your category"
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="description">Description</label>
              <textarea
                id="description"
                className="textarea"
                placeholder="Provide details about the resource"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>

            <div className="form-group">
              <label htmlFor="location">Location</label>
              <input
                type="text"
                id="location"
                className="input"
                placeholder="Your location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-right">
            <label>Upload Images</label>
            <input
              type="file"
              className="input"
              onChange={handleImageUpload}
              accept="image/*"
              multiple
            />

            {/* Image preview */}
            {images.length > 0 && (
              <div className="image-preview-container">
                {images.map((image, index) => (
                  <div key={index} className="image-preview">
                    <img
                      src={URL.createObjectURL(image)}
                      alt={`Preview ${index}`}
                    />
                    <button
                      type="button"
                      className="remove-image-btn"
                      onClick={() => handleRemoveImage(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <button type="submit" className="btn-submit">
          Submit
        </button>
      </form>
    </div>
  );
};

export default RequestResource;
