export interface RefState<T> {
    //获取状态引用
    onRefState?: (state: T) => void
}