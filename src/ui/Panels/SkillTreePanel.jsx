import React from 'react';
import useMetaStore, { SKILL_TREE } from '../../store/useMetaStore';
import GameButton from '../components/GameButton';
import AudioManager from '../../audio/AudioManager';

const TREE_LAYOUT = {
    autoEquip:     { x: 0, y: 0 },
    luckyLoot:     { x: 1, y: 0 },
    goldInterest:  { x: 2, y: 0 },
    partySizePlus: { x: 0.5, y: 1 },
    startingSkills:{ x: 1.5, y: 1 },
};

const NODE_ICONS = {
    autoEquip: '⚔️',
    luckyLoot: '🍀',
    goldInterest: '💰',
    partySizePlus: '👥',
    startingSkills: '✨',
};

const SkillTreePanel = () => {
    const { souls, skillTree, buySkillTreeNode, getSkillTreeNodeCost } = useMetaStore();

    const nodeW = 140;
    const nodeH = 90;
    const gapX = 160;
    const gapY = 120;
    const padX = 30;
    const padY = 20;

    const getNodePos = (id) => {
        const layout = TREE_LAYOUT[id];
        return {
            cx: padX + layout.x * gapX + nodeW / 2,
            cy: padY + layout.y * gapY + nodeH / 2,
        };
    };

    const canBuy = (id) => {
        const node = SKILL_TREE[id];
        const level = skillTree[id] || 0;
        if (level >= node.maxLevel) return false;
        for (const prereq of node.prereqs) {
            if ((skillTree[prereq] || 0) < 1) return false;
        }
        return souls >= getSkillTreeNodeCost(id);
    };

    const isLocked = (id) => {
        const node = SKILL_TREE[id];
        for (const prereq of node.prereqs) {
            if ((skillTree[prereq] || 0) < 1) return true;
        }
        return false;
    };

    const handleBuy = (id) => {
        if (buySkillTreeNode(id)) {
            AudioManager.playSFX('ui_equip');
        }
    };

    // Draw connection lines
    const lines = [];
    Object.entries(SKILL_TREE).forEach(([id, node]) => {
        node.prereqs.forEach(prereq => {
            const from = getNodePos(prereq);
            const to = getNodePos(id);
            const owned = (skillTree[prereq] || 0) >= 1;
            lines.push({ from, to, owned, key: `${prereq}-${id}` });
        });
    });

    const svgW = padX * 2 + 2 * gapX + nodeW;
    const svgH = padY * 2 + gapY + nodeH;

    return (
        <div style={{ position: 'relative', width: svgW, margin: '0 auto' }}>
            {/* SVG connection lines */}
            <svg width={svgW} height={svgH} style={{ position: 'absolute', top: 0, left: 0, pointerEvents: 'none' }}>
                {lines.map(l => (
                    <line
                        key={l.key}
                        x1={l.from.cx} y1={l.from.cy}
                        x2={l.to.cx} y2={l.to.cy}
                        stroke={l.owned ? '#8e44ad' : '#444'}
                        strokeWidth={2}
                        strokeDasharray={l.owned ? 'none' : '6,4'}
                    />
                ))}
            </svg>

            {/* Nodes */}
            {Object.entries(SKILL_TREE).map(([id, node]) => {
                const layout = TREE_LAYOUT[id];
                const level = skillTree[id] || 0;
                const isOwned = level >= node.maxLevel;
                const locked = isLocked(id);
                const affordable = canBuy(id);
                const cost = getSkillTreeNodeCost(id);

                const borderCol = isOwned ? '#27ae60' : affordable ? '#f1c40f' : locked ? '#555' : '#888';
                const bgCol = isOwned ? 'rgba(39,174,96,0.15)' : affordable ? 'rgba(241,196,15,0.1)' : 'rgba(255,255,255,0.03)';

                return (
                    <div
                        key={id}
                        style={{
                            position: 'absolute',
                            left: padX + layout.x * gapX,
                            top: padY + layout.y * gapY,
                            width: nodeW,
                            height: nodeH,
                            background: bgCol,
                            border: `2px solid ${borderCol}`,
                            borderRadius: '12px',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: affordable ? 'pointer' : 'default',
                            opacity: locked ? 0.5 : 1,
                            transition: 'all 0.2s',
                        }}
                        onClick={() => affordable && handleBuy(id)}
                        title={node.description}
                    >
                        <div style={{ fontSize: '1.2rem' }}>{NODE_ICONS[id]}</div>
                        <div style={{ fontSize: '0.75rem', fontWeight: 'bold', color: borderCol, textAlign: 'center' }}>
                            {node.name}
                        </div>
                        <div style={{ fontSize: '0.65rem', color: '#bdc3c7' }}>
                            {isOwned ? 'OWNED' : locked ? 'LOCKED' : `${cost} ✦`}
                            {!isOwned && node.maxLevel > 1 && ` (${level}/${node.maxLevel})`}
                        </div>
                    </div>
                );
            })}

            {/* Spacer so parent knows the height */}
            <div style={{ height: svgH }} />
        </div>
    );
};

export default SkillTreePanel;
