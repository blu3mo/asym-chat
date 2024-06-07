"use client";

import { React, useEffect, useState } from 'react';
import Script from 'next/script';
import { createClient } from '@supabase/supabase-js';

export default function GazeManager({ roomId, userName }) {

    const [isWebGazerLoaded, setIsWebGazerLoaded] = useState(false);
    const [showCalibrationGuide, setShowCalibrationGuide] = useState(false);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_API_KEY
    );

    const loadWebGazer = () => {
        // Load WebGazer
        const webgazer = window.webgazer;
        console.log(webgazer);
      
        if (!webgazer) {
          return;
        }
        if (isWebGazerLoaded) {
          return;
        }
      
        let lastInsertTime = Date.now();
      
        webgazer.setGazeListener(async (data, elapsedTime) => {
          if (data == null) {
            return;
          }
          console.log(data, elapsedTime);
            
          const currentTime = Date.now();
          if (currentTime - lastInsertTime >= 300) {
            // Calculate average gaze data over the 1-second interval
      
            const { x, y } = data;
            try {
              const { error } = await supabase.from('gaze').insert({
                x: x,
                y: y,
                wx: window.innerWidth,
                wy: window.innerHeight,
                roomId: roomId,
                userName: userName,
              });
      
              if (error) {
                console.error('Error inserting gaze data:', error);
              } else {
                console.log('Gaze data inserted successfully');
              }
            } catch (error) {
              console.error('Error inserting gaze data:', error);
            }
      
            lastInsertTime = currentTime;
          }
        }).begin();
      
        webgazer.params.showVideo = false;
        setShowCalibrationGuide(true);
        setIsWebGazerLoaded(true);
      };

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