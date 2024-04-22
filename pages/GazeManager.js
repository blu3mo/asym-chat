"use client";

import { React, useEffect, useState } from 'react';
import Script from 'next/script';

export default function GazeManager() {

    const [isWebGazerLoaded, setIsWebGazerLoaded] = useState(false);
    const [showCalibrationGuide, setShowCalibrationGuide] = useState(false);

    const loadWebGazer = () => {
        // Load WebGazer
        const webgazer = window.webgazer
        console.log(webgazer);

        if (!webgazer) {
            return;
        }
        if (isWebGazerLoaded) {
            return;
        }
        webgazer.setGazeListener((data, elapsedTime) => {
            if (data == null) {
                return;
            }
            console.log(data, elapsedTime);
        }).begin();
        webgazer.params.showVideo = false;
        setShowCalibrationGuide(true);
        setIsWebGazerLoaded(true);
    }

    useEffect(() => {
        // handler object
        const handleEvent = (ev) => {
          if (ev.code === 'KeyG' && ev.ctrlKey) {
            loadWebGazer();
          }
          if (ev.code === 'KeyA' && ev.ctrlKey) {
            setShowCalibrationGuide(false);
          }
        };
        window.addEventListener('keyup', handleEvent);
        return () => {
          window.removeEventListener('keyup', handleEvent);
        };
      }, []);

    return (
        <>
            <Script src="https://webgazer.cs.brown.edu/webgazer.js?" />
            {
                showCalibrationGuide && (
                    <div style={{width: "100%", height: "100%", backgroundColor: "white"}}>
                        <img src="./calibrationguide.png" style={{width: "100%", height: "auto"}}></img>
                    </div>
                )
            }
        </>
    );
}