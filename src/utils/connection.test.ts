import { describe, it, expect } from 'vitest';
import { isOutputPort, isInputPort, getInputPortId, validateConnection } from '@/utils/connection';

const createMockMagnet = (portGroup: string) => ({
  getAttribute: (name: string) => (name === 'port-group' ? portGroup : null),
});

const createMockCell = (type: string) => ({
  data: { type },
});

describe('connection', () => {
  describe('isOutputPort', () => {
    it('should return true for right port group', () => {
      expect(isOutputPort('right')).toBe(true);
    });

    it('should return true for bottom port group', () => {
      expect(isOutputPort('bottom')).toBe(true);
    });

    it('should return false for left port group', () => {
      expect(isOutputPort('left')).toBe(false);
    });

    it('should return false for top port group', () => {
      expect(isOutputPort('top')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isOutputPort(null)).toBe(false);
      expect(isOutputPort(undefined)).toBe(false);
    });
  });

  describe('isInputPort', () => {
    it('should return true for left port group', () => {
      expect(isInputPort('left')).toBe(true);
    });

    it('should return true for top port group', () => {
      expect(isInputPort('top')).toBe(true);
    });

    it('should return false for right port group', () => {
      expect(isInputPort('right')).toBe(false);
    });

    it('should return false for bottom port group', () => {
      expect(isInputPort('bottom')).toBe(false);
    });

    it('should handle null and undefined', () => {
      expect(isInputPort(null)).toBe(false);
      expect(isInputPort(undefined)).toBe(false);
    });
  });

  describe('getInputPortId', () => {
    it('should return in-left for right port', () => {
      expect(getInputPortId('out-right')).toBe('in-left');
    });

    it('should return in-top for bottom port', () => {
      expect(getInputPortId('out-bottom')).toBe('in-top');
    });

    it('should return in-left as default', () => {
      expect(getInputPortId('unknown-port')).toBe('in-left');
    });
  });

  describe('validateConnection', () => {
    it('should return invalid when source magnet is null', () => {
      const result = validateConnection({}, {}, null, {});
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('源连接点不存在');
    });

    it('should return invalid when target magnet is null', () => {
      const result = validateConnection({}, {}, {}, null);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('目标连接点不存在');
    });

    it('should return invalid when connecting to self', () => {
      const cell = createMockCell('task');
      const magnet = createMockMagnet('right');
      const result = validateConnection(cell, cell, magnet, magnet);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('不能连接到自身');
    });

    it('should return invalid when source is OUTPUT node', () => {
      const sourceCell = createMockCell('OUTPUT');
      const targetCell = createMockCell('task');
      const sourceMagnet = createMockMagnet('right');
      const targetMagnet = createMockMagnet('left');
      const result = validateConnection(sourceCell, targetCell, sourceMagnet, targetMagnet);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('输出节点不能作为源节点');
    });

    it('should return invalid when target is INPUT node', () => {
      const sourceCell = createMockCell('task');
      const targetCell = createMockCell('INPUT');
      const sourceMagnet = createMockMagnet('right');
      const targetMagnet = createMockMagnet('left');
      const result = validateConnection(sourceCell, targetCell, sourceMagnet, targetMagnet);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('开始节点不能作为目标节点');
    });

    it('should return invalid when source port is not output', () => {
      const sourceCell = createMockCell('task');
      const targetCell = createMockCell('task');
      const sourceMagnet = createMockMagnet('left');
      const targetMagnet = createMockMagnet('left');
      const result = validateConnection(sourceCell, targetCell, sourceMagnet, targetMagnet);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('输入桩不能发起连线，请使用输出桩（右侧或底部）');
    });

    it('should return invalid when target port is not input', () => {
      const sourceCell = createMockCell('task');
      const targetCell = createMockCell('task');
      const sourceMagnet = createMockMagnet('right');
      const targetMagnet = createMockMagnet('right');
      const result = validateConnection(sourceCell, targetCell, sourceMagnet, targetMagnet);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('输出桩不能接收连线，请连接至输入桩（左侧或顶部）');
    });

    it('should return valid for valid connection', () => {
      const sourceCell = createMockCell('task');
      const targetCell = createMockCell('task');
      const sourceMagnet = createMockMagnet('right');
      const targetMagnet = createMockMagnet('left');
      const result = validateConnection(sourceCell, targetCell, sourceMagnet, targetMagnet);
      expect(result.valid).toBe(true);
      expect(result.reason).toBe('');
    });

    it('should return invalid when connection already exists', () => {
      const sourceCell = { ...createMockCell('task'), id: 'A' };
      const targetCell = { ...createMockCell('task'), id: 'B' };
      const sourceMagnet = createMockMagnet('right');
      const targetMagnet = createMockMagnet('left');
      const graph = {
        getEdges: () => [
          {
            getSourceCellId: () => 'A',
            getTargetCellId: () => 'B',
          },
        ],
      };
      const result = validateConnection(sourceCell, targetCell, sourceMagnet, targetMagnet, graph);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('这两节点之间已存在连线');
    });
  });
});
