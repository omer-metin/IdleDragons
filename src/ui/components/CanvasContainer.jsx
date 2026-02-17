import React, { useEffect, useRef } from 'react';
import GameApp from '../../game/GameApp';

const CanvasContainer = ({ onInitComplete }) => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            GameApp.init(containerRef.current).then(() => {
                if (onInitComplete) onInitComplete();
            });
        }

        return () => {
            GameApp.destroy();
        };
    }, []);

    return (
        <div
            ref={containerRef}
            data-tutorial="grid"
            style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                zIndex: 0
            }}
        />
    );
};

export default CanvasContainer;
