/**
 * MoveHistory — scrollable list of moves in SAN notation
 */
import React, { useEffect, useRef } from 'react';

export default function MoveHistory({ moves }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [moves]);

  // Group moves into pairs (white + black)
  const pairs = [];
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1] || null,
    });
  }

  return (
    <div className="move-history">
      <div className="panel-title">Move History</div>
      <div className="move-list">
        {pairs.length === 0 && (
          <div className="move-empty">No moves yet</div>
        )}
        {pairs.map(pair => (
          <div key={pair.number} className="move-pair">
            <span className="move-number">{pair.number}.</span>
            <span className={`move-san move-white ${!pair.black ? 'move-last' : ''}`}>
              {pair.white?.san}
            </span>
            {pair.black && (
              <span className="move-san move-black move-last">
                {pair.black?.san}
              </span>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
