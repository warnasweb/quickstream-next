import React, { useEffect, useRef, useState } from 'react';

const QuickStreamTrustedFrame = ({ onReady }) => {
  const hasInitialized = useRef(false); // 👈 prevent double init
  const [isLoaded, setIsLoaded] = useState(false); // loading state

  useEffect(() => {
    if (hasInitialized.current) return;

    const script = document.createElement('script');
    let inputStyle = {
      height: "34px",
      padding: "0px 12px",
      "font-size": "14px",
      border: "1px solid #ccc",
      "border-radius": "2px"
    };
  
    script.src =
      'https://api.quickstream.support.qvalent.com/rest/v1/quickstream-api-1.0.min.js';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      if (window.QuickstreamAPI && !hasInitialized.current) {
        window.QuickstreamAPI.init({
          publishableApiKey:
            'C01855_PUB_i24grfa59vct62pfksuwr4iktgv5nzs57cuwr2uvi49d2b74z8umr3pawh3n',
        });

        const options = {
          config: {
            supplierBusinessCode: 'C01855',
          },
          iframe: {
            style: {
              minHeight: '400px',
              //width: '100%',
              border: '0px solid #ccc',
              //borderRadius: '4px',
              padding: '1rem',
              backgroundColor: '#fff',
            },
          },
          showAcceptedCards: true,
          showRequiredIndicators: true,
    cardholderName: {
      style: inputStyle,
      label: "Name on card"
    },
    cardNumber: {
      style: inputStyle,
      label: "Card number"
    },
    expiryDateMonth: {
      style: inputStyle
    },
    expiryDateYear: {
      style: inputStyle
    },
    cvn: {
      hidden: false,
      label: "Security code"
    },
    body: {
      style: {}
    }   
        };

        window.QuickstreamAPI.creditCards.createTrustedFrame(options, (errors, data) => {
          if (errors) {
            console.error('Trusted Frame error:', JSON.stringify(errors));
            return;
          }

          hasInitialized.current = true; // ✅ now it's safe
          setIsLoaded(true); // 👈 hide loading message

          const trustedFrame = data.trustedFrame;
          if (typeof onReady === 'function') {
            onReady(trustedFrame);
            //"cardholderName","JMD",
            trustedFrame.changePlaceholder( "cardNumber", "4242424242424242", function(errors, data) {
            if (errors) {
              console.error('Cardholder Name errors:', errors);
            } else {
              console.log('Cardholder Name set successfully:', data);
            }
          });
          var style = {
                color: "blue",
                "font-size": "14px",
                "font-weight": "bold",
            };

          trustedFrame.changeStyle( "labels", style, function( errors, data ) {
            if ( errors ) {
                // Handle errors here
            }
            else {
                console.log( "labels styling has been changed!" );
            }
        } );
          
          }
        });
      }
    };

    return () => {
      // Optional: don't remove script if reused on same page
    };
  }, [onReady]);

  return (
    <div className="mb-6"
      data-quickstream-api="creditCardContainer"
      style={{ height: '300px',  border: '1px solid #ccc', borderRadius: '4px' }}
    >
      {/* The QuickStream Trusted Frame will be injected here */}
      {!isLoaded && (
        <p
          id="loadingMessage"
          style={{
            position: 'absolute',
            textAlign: 'center',
            width: '100%',
            top: '40%',
            left: 0,
            color: '#555',
            fontSize: '1rem',
          }}
        >
          Loading payment form...
        </p>
      )}
    </div>
  );
};

export default QuickStreamTrustedFrame;
