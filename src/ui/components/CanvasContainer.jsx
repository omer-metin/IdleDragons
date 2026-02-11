import React, { useEffect, useRef } from 'react';
import GameApp from '../../game/GameApp';

const CanvasContainer = () => {
    const containerRef = useRef(null);

    useEffect(() => {
        if (containerRef.current) {
            GameApp.init(containerRef.current);
        }

        return () => {
            GameApp.destroy();
        };
    }, []);

    return (
        <div
            ref={containerRef}
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
