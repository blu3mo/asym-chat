"use client";

import { React, useEffect, useState, useRef } from 'react';
import Script from 'next/script';
import { createClient } from '@supabase/supabase-js';

export default function GazeManager({ roomId, userName }) {

    const [isWebGazerLoaded, setIsWebGazerLoaded] = useState(false);
    const [showCalibrationGuide, setShowCalibrationGuide] = useState(false);
    const [saveGaze, setSaveGaze] = useState(false);
    const saveGazeRef = useRef(saveGaze);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_API_KEY
    );

    const loadWebGazer = () => {
        // Load WebGazer
        const webgazer = window.webgazer;
      
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
            
          const currentTime = Date.now();
          if (currentTime - lastInsertTime >= 500 && saveGazeRef.current) {
            // Calculate average gaze data over the 1-second interval
      
            lastInsertTime = currentTime;
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
                console.log("saveGaze: ", saveGazeRef.current);
                console.log('Gaze data inserted successfully');
                console.log('Gaze data:', x, y);
              }
            } catch (error) {
              console.error('Error inserting gaze data:', error);
            }
      
          }
        }).begin();
      
        webgazer.params.showVideo = false;
        window.webgazer.params.showGazeDot = false;
        setShowCalibrationGuide(true);
        setIsWebGazerLoaded(true);
      };

      useEffect(() => {
        saveGazeRef.current = saveGaze; // Update the ref whenever saveGaze changes
    }, [saveGaze]);

    useEffect(() => {

      console.log("roomId: ", roomId);
        // handler object
        const handleEvent = (ev) => {
          if (ev.code === 'KeyI' && ev.ctrlKey) {
            if (isWebGazerLoaded) {
              console.log('WebGazer is already loaded.');
              return;
            }
            loadWebGazer();
          }
          if (ev.code === 'KeyA' && ev.ctrlKey) {
            setShowCalibrationGuide(false);
            setSaveGaze(true);
          }
        };
        window.addEventListener('keyup', handleEvent);
        return () => {
          window.removeEventListener('keyup', handleEvent);
        };
      }, [roomId, userName]);


    
    useEffect(() => {
        const webgazer = window.webgazer;
        if (!webgazer) {
            return;
          }
        window.webgazer.params.showGazeDot = false;
    }, [showCalibrationGuide]);

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
