import React from 'react'
import './Category.css'
const Category = () => {
  return (
    <>
    <div>
       <section id="categories" className="categories">
                <h2>Categories</h2>
                <div className="category-grid">
                    <div className="category-card">
                        <h3>Food</h3>
                        <button className="btn">Explore</button>
                    </div>
                    <div className="category-card">
                        <h3>Clothing</h3>
                        <button className="btn">Explore</button>
                    </div>
                    
                </div>
            </section>
    </div>
    </>
  )
}

export default Category
