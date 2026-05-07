import React, { useState } from 'react';
import Button from './components/Button';
import './App.css';

function App() {
  const [clickCount, setClickCount] = useState(0);

  return (
    <div className="App">
      <header className="App-header">
        <h1>Figma Component Generator Demo</h1>
        <p>This demo showcases components generated from Figma designs</p>
      </header>

      <main className="App-main">
        <section className="demo-section">
          <h2>Button Component</h2>
          <p className="demo-description">
            Generated component with multiple variants and sizes, including accessibility attributes.
          </p>

          <div className="button-showcase">
            <div className="button-group">
              <h3>Variants</h3>
              <div className="button-row">
                <Button variant="primary">Primary</Button>
                <Button variant="secondary">Secondary</Button>
                <Button variant="ghost">Ghost</Button>
              </div>
            </div>

            <div className="button-group">
              <h3>Sizes</h3>
              <div className="button-row">
                <Button variant="primary" size="small">Small</Button>
                <Button variant="primary" size="medium">Medium</Button>
                <Button variant="primary" size="large">Large</Button>
              </div>
            </div>

            <div className="button-group">
              <h3>States</h3>
              <div className="button-row">
                <Button variant="primary">Normal</Button>
                <Button variant="primary" disabled>Disabled</Button>
                <Button 
                  variant="primary" 
                  aria-label="Click counter button"
                  onClick={() => setClickCount(count => count + 1)}
                >
                  Clicked {clickCount} times
                </Button>
              </div>
            </div>
          </div>
        </section>

        <section className="info-section">
          <h2>Features</h2>
          <ul>
            <li>✅ Multiple variants (primary, secondary, ghost)</li>
            <li>✅ Multiple sizes (small, medium, large)</li>
            <li>✅ Accessibility attributes (ARIA, keyboard navigation)</li>
            <li>✅ Focus states for keyboard users</li>
            <li>✅ Disabled state handling</li>
            <li>✅ Generated from Figma designs</li>
          </ul>
        </section>

        <section className="cta-section">
          <h2>Try It Yourself</h2>
          <p>Generate your own components from Figma:</p>
          <code className="code-block">
            npm install -g figma-component-generator
            <br />
            generate-component generate --url "your-figma-url" --name YourComponent
          </code>
        </section>
      </main>
    </div>
  );
}

export default App;