/**
 * 
 * @author clong 2026.01.09
 */
export default class Utils {

    /**
     * 根据路径寻找节点
     * @param node 
     * @param path 
     * @returns 
     */
    public static getChildByPath(node: cc.Node, path: string) {
        if (!node || cc.isValid(node) == false) {
            console.error("node is null:" + path);
            return null;
        }
        if (!path || path.length == 0) {
            return node;
        }
        let _names: string[] = path.split('/');
        let _node = node;
        for (let index = 0; index < _names.length; index++) {
            _node = _node.getChildByName(_names[index]);
            if (!_node) {
                return null;
            }
        }
        return _node;
    }
}