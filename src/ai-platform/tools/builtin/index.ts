import { registerTool } from '../registry/tool-registry';
import {
  calculatorToolDefinition,
  calculatorToolHandler,
} from './calculator.tool';
import { searchToolDefinition, searchToolHandler } from './search.tool';

export function registerBuiltinTools(): void {
  registerTool(searchToolDefinition, searchToolHandler);
  registerTool(calculatorToolDefinition, calculatorToolHandler);
}
