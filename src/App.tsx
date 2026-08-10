import { useState, useEffect } from 'react';
import { useGLTF } from '@react-three/drei';
import LocalSlideshow from './components/Carousel';
import { ModelViewer } from './components/ModelViewer';
import './App.css';

interface CardProps {
  isActive?: boolean;
  imageUrl: string;
  label: string;
  modelUrl: string;
  bgUrl: string;
  link?: string;
}

function Card({ isActive = false, imageUrl, label, modelUrl, bgUrl, link }: CardProps) {
  const [modelLoaded, setModelLoaded] = useState(false);
  const [shouldRenderModel, setShouldRenderModel] = useState(false);

  // Delay mounting of the model until after transition settles
  useEffect(() => {
    if (isActive) {
      const timer = setTimeout(() => {
        setShouldRenderModel(true);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      setShouldRenderModel(false);
      setModelLoaded(false);
    }
  }, [isActive]);

  return (
    <div className={`product-card-container ${isActive ? 'active' : ''}`}>
      <div className="product-card-box">
        {/* The background frame with textured image/gradient */}
        <div
          className="product-card-bg-frame"
          style={{ backgroundImage: `url('${bgUrl}')` }}
        />

        {/* Render the static preview image. Fade it out once the 3D model loads */}
        <img
          src={imageUrl}
          alt={label}
          className="card-preview-image"
          style={{
            opacity: modelLoaded ? 0 : 1,
            transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          }}
        />

        {/* If the card is active and delay has passed, mount the 3D viewer. */}
        {isActive && shouldRenderModel && (
          <div 
            className="card-3d-container"
            style={{
              opacity: modelLoaded ? 1 : 0,
              transition: 'opacity 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
              pointerEvents: modelLoaded ? 'auto' : 'none'
            }}
          >
            <ModelViewer
              modelUrl={modelUrl}
              imageUrl={imageUrl}
              onLoaded={() => setModelLoaded(true)}
            />
          </div>
        )}
      </div>

      {/* Button Under Card */}
      <button 
        className="card-explore-button"
        onClick={() => {
          if (link) {
            window.open(link, "_blank", "noopener,noreferrer");
          }
        }}
      >
        <div className="button-arrow-circle">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="5" y1="12" x2="19" y2="12"></line>
            <polyline points="12 5 19 12 12 19"></polyline>
          </svg>
        </div>
        <span className="button-label-text">
          {label}
        </span>
      </button>
    </div>
  );
}

const CARDS_DATA = [
  {
    label: "EXPLORE SAUNAS",
    imageUrl: "/assets/sauna.webp",
    modelUrl: "/assets/Sauna.glb",
    bgUrl: "/assets/sauna_bg.webp",
    link: "https://cedarandstonesauna.com/for-home/model-5-5/",
  },
  {
    label: "EXPLORE LUGGAGE",
    imageUrl: "/assets/bag.webp",
    modelUrl: "/assets/Luggage_Bag.glb",
    bgUrl: "/assets/bag_bg.webp",
    link: "https://www.roamluggage.com/collections/carry-on-luggage/products/carry-on",
  },
  {
    label: "EXPLORE BATHWARE",
    imageUrl: "/assets/bathtub.webp",
    modelUrl: "/assets/Spa_4_Seater.glb",
    bgUrl: "/assets/bathware_bg.webp",
    link: "https://viewer.ikarusdelta.com/product/v8?id=6fa8b298-d093-48db-805a-c0afbd2ff688",
  },
  {
    label: "EXPLORE FURNITURE",
    imageUrl: "/assets/Chair.webp",
    modelUrl: "/assets/Chair.glb",
    bgUrl: "/assets/chair_bg.webp",
    link: "https://viewer.ikarusdelta.com/product/v6?id=8e34beb1-4f24-4f83-9905-4513cfe3399e",
  },
  {
    label: "EXPLORE REFORMERS",
    imageUrl: "/assets/sculptformer.webp",
    modelUrl: "/assets/Sculptformer.glb",
    bgUrl: "/assets/sculptformer_bg.webp",
    link: "https://foldreformer.com/products/fold-reformer-bed",
  },
  {
    label: "EXPLORE TRAILERS",
    imageUrl: "/assets/trailer.webp", 
    modelUrl: "/assets/Trailer.glb",
    bgUrl: "/assets/trailer_bg.webp",
    link: "",
  },
];

function useWindowSize() {
  const [size, setSize] = useState([window.innerWidth, window.innerHeight]);
  useEffect(() => {
    const handleResize = () => {
      setSize([window.innerWidth, window.innerHeight]);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  return size;
}

function App() {
  const [width] = useWindowSize();

  // Preload all 3D GLB assets in the background
  useEffect(() => {
    CARDS_DATA.forEach((card) => {
      useGLTF.preload(card.modelUrl);
    });
  }, []);

  // Calculate dynamic card size based on viewport width
  let cardSize = 320;
  if (width >= 1920) cardSize = 480;
  else if (width >= 1440) cardSize = 440;
  else if (width >= 1200) cardSize = 400;
  else if (width >= 992) cardSize = 360;
  else if (width >= 768) cardSize = 320;
  else cardSize = Math.max(220, Math.min(280, width - 80));

  // Calculate proportional spacing gap
  const gap = width >= 1200 ? 60 : width >= 768 ? 40 : 20;

  return (
    <div className="app-container">
      <main className="display-area">
        <div className="carousel-wrapper">
          <LocalSlideshow
            direction="left"
            autoPlay={false}
            interval={3000}
            draggable={false}
            current={3} // Card 4 ("EXPLORE FURNITURE") is active by default
            align="center"
            items={6}
            gap={gap}
            padding="20px 20px 100px 20px"
            radius="0px"
            activeScale={1.0}
            inactiveScale={0.5}
            activeOpacity={1.0}
            inactiveOpacity={1.0}
            tapInactiveToCenter={true}
            showArrows={true}
            arrowSize={48}
            arrowBottom={40}
            arrowGap={12}
            arrowBackground="#e4e4e7"
            arrowColor="#18181b"
            itemWidth={cardSize}
            itemHeight={cardSize}
            transitionType="spring"
            springStiffness={280}
            springDamping={45}
            tweenDuration={0.35}
            background="transparent"
            card1={<Card {...CARDS_DATA[0]} />}
            card2={<Card {...CARDS_DATA[1]} />}
            card3={<Card {...CARDS_DATA[2]} />}
            card4={<Card {...CARDS_DATA[3]} />}
            card5={<Card {...CARDS_DATA[4]} />}
            card6={<Card {...CARDS_DATA[5]} />}
          />
        </div>
      </main>
    </div>
  );
}

export default App;
