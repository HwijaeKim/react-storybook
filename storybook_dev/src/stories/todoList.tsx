import React, { useState, useEffect, useCallback, useMemo } from 'react';

import './todoList.scss';

// 타입 정의
interface TodoItem {
    id: number | string;
    text: string;
    completed: boolean;
    exec_date?: string;
    isCurrentDate?: boolean;
    groupId?: number | string;
}

interface GroupTodoItem {
    id: number | string;
    text: string;
    completed: boolean;
    groupId: number | string;
    exec_date?: string;
}

interface TodoListProps {
    type: 'home' | 'page-todolist' | 'group' | 'group-detail' | 'example-todo' | 'personal';
    selectedDate?: string;
    onTodoProgressChange?: (total: number, completed: number) => void;
    onAllTodosChange?: (completedDates: Record<string, boolean>) => void;
    groupId?: number | string;
    isLeader?: boolean;
}

const TodoList: React.FC<TodoListProps> = ({ 
    type, 
    selectedDate, 
    onTodoProgressChange, 
    onAllTodosChange, 
    groupId, 
    isLeader 
}) => {
    // 투두 목록 상태
    const [todoItems, setTodoItems] = useState<TodoItem[]>([]);
    const [groupTodos, setGroupTodos] = useState<GroupTodoItem[]>([]);
    
    // 투두 추가 관련 상태
    const [newTodoText, setNewTodoText] = useState<string>('');
    const [isAddingTodo, setIsAddingTodo] = useState<boolean>(false);

    // 더보기 및 수정 관련 상태
    const [moreOption, setMoreOption] = useState<boolean>(false);
    const [selectedTodoId, setSelectedTodoId] = useState<number | string | null>(null);
    const [selectedTodoType, setSelectedTodoType] = useState<'personal' | 'group' | null>(null);
    const [editingTodoId, setEditingTodoId] = useState<number | string | null>(null);
    const [editingTodoType, setEditingTodoType] = useState<'personal' | 'group' | null>(null);
    const [editingText, setEditingText] = useState<string>('');

    // selectedDate의 기본값 설정 (props로 전달되지 않을 경우 오늘 날짜)
    const today = new Date().toISOString().slice(0, 10);
    const effectiveSelectedDate = selectedDate || today;

    // 더미 데이터
    const dummyPersonalTodos: TodoItem[] = useMemo(() => [
        { id: 1, text: '오늘의 목표 1', completed: false, exec_date: today, isCurrentDate: true },
        { id: 2, text: '오늘의 목표 2', completed: true, exec_date: today, isCurrentDate: true },
        { id: 3, text: '내일의 목표', completed: false, exec_date: new Date(Date.now() + 86400000).toISOString().slice(0, 10), isCurrentDate: false },
    ], [today]);

    const dummyGroupTodos: GroupTodoItem[] = useMemo(() => [
        { id: 1, text: '그룹 미션 1', completed: false, groupId: groupId || 1, exec_date: today },
        { id: 2, text: '그룹 미션 2', completed: true, groupId: groupId || 1, exec_date: today },
    ], [groupId, today]);

    // 투두 목록 가져오기 함수 (개인 투두) - 더미 데이터
    const fetchPersonalTodos = useCallback(() => {
        // 더미 데이터 사용
        const formattedTodos = dummyPersonalTodos.map(item => ({
            ...item,
            isCurrentDate: item.exec_date === effectiveSelectedDate
        }));
        setTodoItems(formattedTodos);

        if (onTodoProgressChange) {
            const todayTodos = formattedTodos.filter(item => item.isCurrentDate === true);
            const completedTodayTodos = todayTodos.filter(item => item.completed).length;
            onTodoProgressChange(todayTodos.length, completedTodayTodos);
        }
        if (onAllTodosChange) {
            const datesCompletion: Record<string, { total: number; completed: number }> = {};
            formattedTodos.forEach(item => {
                if (item.exec_date) {
                    if (!datesCompletion[item.exec_date]) {
                        datesCompletion[item.exec_date] = { total: 0, completed: 0 };
                    }
                    datesCompletion[item.exec_date].total++;
                    if (item.completed) {
                        datesCompletion[item.exec_date].completed++;
                    }
                }
            });
            const completedDates: Record<string, boolean> = {};
            for (const date in datesCompletion) {
                completedDates[date] = datesCompletion[date].total > 0 && datesCompletion[date].total === datesCompletion[date].completed;
            }
            onAllTodosChange(completedDates);
        }
    }, [effectiveSelectedDate, onTodoProgressChange, onAllTodosChange, dummyPersonalTodos]);

    // 투두 목록 가져오기 함수 (그룹 투두) - 더미 데이터
    const fetchGroupTodos = useCallback(() => {
        // 더미 데이터 사용
        setGroupTodos(dummyGroupTodos);
    }, [dummyGroupTodos]);

    useEffect(() => {
        if (type === 'home' || type === 'page-todolist') {
            fetchPersonalTodos();
            if (type === 'home') {
                fetchGroupTodos();
            }
        } else if ((type === 'group' || type === 'group-detail') && groupId) {
            fetchGroupTodos();
        }
    }, [fetchPersonalTodos, fetchGroupTodos, type, groupId]);

    // 체크박스 변경 핸들러 - 더미 데이터로 로컬 상태만 업데이트
    const handleCheckboxChange = useCallback((item: TodoItem | GroupTodoItem, checked: boolean, todoType: 'personal' | 'group') => {
        if (todoType === 'personal') {
            const updatedItems = todoItems.map(todo => 
                todo.id === item.id ? { ...todo, completed: checked } : todo
            );
            setTodoItems(updatedItems);
        } else if (todoType === 'group') {
            const updatedGroupItems = groupTodos.map(todo => 
                todo.id === item.id ? { ...todo, completed: checked } : todo
            );
            setGroupTodos(updatedGroupItems);
        }
    }, [todoItems, groupTodos]);

    // 투두 추가 관련 함수 - 더미 데이터로 로컬 상태만 업데이트
    async function addTodo(): Promise<void> {
        if (isAddingTodo) {
            if (newTodoText.trim()) {
                const validation = /[\\/"'*]/;
                if (validation.test(newTodoText)) {
                    alert("투두 내용에는 \\, /, \", ', * 문자를 포함할 수 없습니다.");
                    setNewTodoText('');
                    return;
                }

                if (type === 'personal' || type === 'home' || type === 'page-todolist') {
                    const newIdForFrontend = `${Date.now()}-${todoItems.length}`;
                    const newTodoItem: TodoItem = {
                        id: newIdForFrontend,
                        text: newTodoText.trim(),
                        completed: false,
                        exec_date: effectiveSelectedDate,
                        isCurrentDate: true
                    };
                    setTodoItems([...todoItems, newTodoItem]);
                    setNewTodoText('');
                }
            }
            setIsAddingTodo(false);
        } else {
            setIsAddingTodo(true);
        }
    }

    function cancelAdd(): void {
        setIsAddingTodo(false);
        setNewTodoText('');
    }

    function handleKeyPress(e: React.KeyboardEvent<HTMLInputElement>): void {
        if (e.key === 'Enter') {
            addTodo();
        } else if (e.key === 'Escape') {
            cancelAdd();
        }
    }

    // 더보기 및 수정/삭제 관련 함수
    function handleMoreClick(todoId: number | string, todoType: 'personal' | 'group'): void {
        setSelectedTodoId(todoId);
        setSelectedTodoType(todoType);
        setMoreOption(true);
    }

    function closeMoreOption(): void {
        setMoreOption(false);
        setSelectedTodoId(null);
        setSelectedTodoType(null);
    }

    function handleEditTodo(): void {
        const selectedTodo = getSelectedTodo();
        if (selectedTodo) {
            setEditingTodoId(selectedTodoId);
            setEditingTodoType(selectedTodoType);
            setEditingText(selectedTodo.text);
        }
        closeMoreOption();
    }

    function saveEditedTodo(): void {
        if (editingText.trim()) {
            const validation = /[\\/"'*]/;
            if (validation.test(editingText)) {
                alert("투두 내용에는 \\, /, \", ', * 문자를 포함할 수 없습니다.");
                setEditingText('');
                return;
            }
            if (editingTodoType === 'personal') {
                const updatedItems = todoItems.map(item => 
                    item.id === editingTodoId ? { ...item, text: editingText.trim() } : item
                );
                setTodoItems(updatedItems);
            } else if (editingTodoType === 'group') {
                const updatedItems = groupTodos.map(item => 
                    item.id === editingTodoId ? { ...item, text: editingText.trim() } : item
                );
                setGroupTodos(updatedItems);
            }
        }
        cancelEdit();
    }

    function cancelEdit(): void {
        setEditingTodoId(null);
        setEditingTodoType(null);
        setEditingText('');
    }

    function handleEditKeyPress(e: React.KeyboardEvent<HTMLInputElement>): void {
        if (e.key === 'Enter') {
            saveEditedTodo();
        } else if (e.key === 'Escape') {
            cancelEdit();
        }
    }

    async function handleDeleteTodo(): Promise<void> {
        if (selectedTodoType === 'personal') {
            const updatedItems = todoItems.filter(item => item.id !== selectedTodoId);
            setTodoItems(updatedItems);
        } else if (selectedTodoType === 'group') {
            const updatedItems = groupTodos.filter(item => item.id !== selectedTodoId);
            setGroupTodos(updatedItems);
        }
        closeMoreOption();
    }

    // 선택된 todo의 정보 가져오기
    function getSelectedTodo(): TodoItem | GroupTodoItem | null {
        if (selectedTodoType === 'personal') {
            return todoItems.find(item => item.id === selectedTodoId) || null;
        } else if (selectedTodoType === 'group') {
            return groupTodos.find(item => item.id === selectedTodoId) || null;
        }
        return null;
    }

    return (
        <div className={`cmp-todolist${type === 'group-detail' ? ' cmp-todolist--group' : ''}`}>
            <div className="cmp-todolist__inner">
                {
                    (() => {
                        const filteredPersonalTodos = todoItems.filter(item => item.isCurrentDate === true);
                        if (type === 'group' || type === 'group-detail') {
                            if (groupTodos.length === 0) {
                                if (isLeader) {
                                    return (
                                        <p className="no-todo">
                                            이번주 그룹 미션을 생성해봐요.<br></br>
                                        </p>
                                    );
                                } else {
                                    return (
                                        <p className="no-todo">
                                            이번주 그룹 미션이 아직 생성되지 않았어요.<br></br>
                                        </p>
                                    );
                                }
                            }
                        } else if (type === 'home' || type === 'page-todolist') {
                            return filteredPersonalTodos.length === 0 && !isAddingTodo && (
                                <p className="no-todo">
                                    설정된 목표가 없습니다.<br></br>
                                    목표를 추가해 보세요.
                                </p>
                            );
                        } else if (type === 'example-todo') {
                            return (
                                <p className="no-todo">
                                    설정된 목표가 없습니다.<br></br>
                                    목표를 추가해 보세요.
                                </p>
                            );
                        }
                        return null;
                    })()
                }

                {
                    (type === 'home' && todoItems.filter(item => item.isCurrentDate === true).length > 0) && (
                        <p className="day-goal">
                            오늘의 목표 ({todoItems.filter(item => item.isCurrentDate === true && item.completed).length}/{todoItems.filter(item => item.isCurrentDate === true).length})
                        </p>
                    )
                }

                {
                    (todoItems.length > 0 || isAddingTodo) && (type === 'home' || type === 'page-todolist') && (
                        <div className="todo-box">
                            {
                                todoItems.filter((item) => {
                                    return item.isCurrentDate === true;
                                }).map((item) => (
                                    <div key={item.id} className="todo-box__item">
                                        <div className="list">
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onChange={(e) => handleCheckboxChange(item, e.target.checked, 'personal')}
                                                style={{ marginRight: '8px', cursor: 'pointer' }}
                                            />
                                            {editingTodoId === item.id && editingTodoType === 'personal' ? (
                                                <input 
                                                    type="text" 
                                                    className="title-input" 
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    onKeyDown={handleEditKeyPress}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className={`title ${item.completed ? 'done' : ''}`}>{item.text}</span>
                                            )}
                                        </div>
                                        {editingTodoId === item.id && editingTodoType === 'personal' ? (
                                            <div className="actions">
                                                <button className="action-btn save" onClick={saveEditedTodo}>
                                                    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25">
                                                        <path d="M9 16.7L5.5 13.2C5.11 12.81 4.49 12.81 4.1 13.2C3.71 13.59 3.71 14.21 4.1 14.6L8.29 18.79C8.68 19.18 9.31 19.18 9.7 18.79L20.3 8.20001C20.69 7.81001 20.69 7.19001 20.3 6.80001C19.91 6.41001 19.29 6.41001 18.9 6.80001L9 16.7Z" fill="#4C4C4C"/>
                                                    </svg>
                                                </button>
                                                <button className="action-btn cancel" onClick={cancelEdit}>
                                                    <svg width="14" height="15" viewBox="0 0 14 15" xmlns="http://www.w3.org/2000/svg">
                                                        <path d="M13.3 1.20997C12.91 0.819971 12.28 0.819971 11.89 1.20997L7 6.08997L2.11 1.19997C1.72 0.809971 1.09 0.809971 0.700001 1.19997C0.310001 1.58997 0.310001 2.21997 0.700001 2.60997L5.59 7.49997L0.700001 12.39C0.310001 12.78 0.310001 13.41 0.700001 13.8C1.09 14.19 1.72 14.19 2.11 13.8L7 8.90997L11.89 13.8C12.28 14.19 12.91 14.19 13.3 13.8C13.69 13.41 13.69 12.78 13.3 12.39L8.41 7.49997L13.3 2.60997C13.68 2.22997 13.68 1.58997 13.3 1.20997Z" fill="#4C4C4C"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="more" onClick={() => handleMoreClick(item.id, 'personal')}>
                                                <svg width="16" height="5" viewBox="0 0 16 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                    <path d="M2 0.5C0.9 0.5 0 1.4 0 2.5C0 3.6 0.9 4.5 2 4.5C3.1 4.5 4 3.6 4 2.5C4 1.4 3.1 0.5 2 0.5ZM14 0.5C12.9 0.5 12 1.4 12 2.5C12 3.6 12.9 4.5 14 4.5C15.1 4.5 16 3.6 16 2.5C16 1.4 15.1 0.5 14 0.5ZM8 0.5C6.9 0.5 6 1.4 6 2.5C6 3.6 6.9 4.5 8 4.5C9.1 4.5 10 3.6 10 2.5C10 1.4 9.1 0.5 8 0.5Z"/>
                                                </svg>
                                            </div>
                                        )}
                                    </div>
                                ))
                            }
                            
                            {
                                isAddingTodo && (
                                    <div className="todo-box__item todo-box__item--adding">
                                        <div className="list">
                                            <input
                                                type="checkbox"
                                                checked={false}
                                                disabled
                                                style={{ marginRight: '8px' }}
                                            />
                                            <input 
                                                type="text" 
                                                className="title-input" 
                                                value={newTodoText}
                                                onChange={(e) => setNewTodoText(e.target.value)}
                                                onKeyDown={handleKeyPress}
                                                placeholder="할 일을 입력하세요"
                                                autoFocus
                                            />
                                        </div>
                                        <div className="actions">
                                            <button className="action-btn save" onClick={addTodo}>
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25">
                                                    <path d="M9 16.7L5.5 13.2C5.11 12.81 4.49 12.81 4.1 13.2C3.71 13.59 3.71 14.21 4.1 14.6L8.29 18.79C8.68 19.18 9.31 19.18 9.7 18.79L20.3 8.20001C20.69 7.81001 20.69 7.19001 20.3 6.80001C19.91 6.41001 19.29 6.41001 18.9 6.80001L9 16.7Z" fill="#4C4C4C"/>
                                                </svg>
                                            </button>
                                            <button className="action-btn cancel" onClick={cancelAdd}>
                                            <svg width="14" height="15" viewBox="0 0 14 15" xmlns="http://www.w3.org/2000/svg">
                                                <path d="M13.3 1.20997C12.91 0.819971 12.28 0.819971 11.89 1.20997L7 6.08997L2.11 1.19997C1.72 0.809971 1.09 0.809971 0.700001 1.19997C0.310001 1.58997 0.310001 2.21997 0.700001 2.60997L5.59 7.49997L0.700001 12.39C0.310001 12.78 0.310001 13.41 0.700001 13.8C1.09 14.19 1.72 14.19 2.11 13.8L7 8.90997L11.89 13.8C12.28 14.19 12.91 14.19 13.3 13.8C13.69 13.41 13.69 12.78 13.3 12.39L8.41 7.49997L13.3 2.60997C13.68 2.22997 13.68 1.58997 13.3 1.20997Z" fill="#4C4C4C"/>
                                            </svg>

                                            </button>
                                        </div>
                                    </div>
                                )
                            }
                        </div>
                    )
                }

                {(type === 'personal' || type === 'home' || type === 'page-todolist') && (
                        <button className="add-todo" onClick={addTodo}>
                            <div className="text-area">
                                <svg width="14" height="15" viewBox="0 0 14 15" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M13 8.5H8V13.5C8 14.05 7.55 14.5 7 14.5C6.45 14.5 6 14.05 6 13.5V8.5H1C0.45 8.5 0 8.05 0 7.5C0 6.95 0.45 6.5 1 6.5H6V1.5C6 0.95 6.45 0.5 7 0.5C7.55 0.5 8 0.95 8 1.5V6.5H13C13.55 6.5 14 6.95 14 7.5C14 8.05 13.55 8.5 13 8.5Z"/>
                                </svg>
                                추가하기
                            </div>
                        </button>
                    )
                }
                {isLeader && groupTodos.length === 0 && (
                    <button 
                        className="btn btn-primary"
                        onClick={() => {
                            console.log(`그룹 미션 생성하기: /groupmissionform/${groupId}`);
                        }}
                    >
                        그룹 미션 생성하기
                    </button>
                )}

                {(type === 'group' || type === 'group-detail' || type === 'home') && groupTodos.length > 0 && (
                        <div className={`todo-box group-todo-box`}>
                            {(type !== 'group' && type !== 'group-detail') && (
                            <p className={`day-goal`}>
                                그룹 목표 ({groupTodos.filter(item => item.completed).length}/{groupTodos.length})
                            </p>
                            )}
                            {
                                groupTodos.map((item) => (
                                    <div key={item.id} className="todo-box__item">
                                        <div className="list">
                                            <input
                                                type="checkbox"
                                                checked={item.completed}
                                                onChange={(e) => handleCheckboxChange(item, e.target.checked, 'group')}
                                                style={{ marginRight: '8px', cursor: 'pointer' }}
                                            />
                                            {editingTodoId === item.id && editingTodoType === 'group' ? (
                                                <input 
                                                    type="text" 
                                                    className="title-input" 
                                                    value={editingText}
                                                    onChange={(e) => setEditingText(e.target.value)}
                                                    onKeyDown={handleEditKeyPress}
                                                    autoFocus
                                                />
                                            ) : (
                                                <span className={`title ${item.completed ? 'done' : ''}`}>{item.text}</span>
                                            )}
                                        </div>
                                                        {(type === 'group-detail' && isLeader) && (
                                                            editingTodoId === item.id && editingTodoType === 'group' ? (
                                                                <div className="actions">
                                                                    <button className="action-btn save" onClick={saveEditedTodo}>
                                                                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="25" viewBox="0 0 24 25">
                                                                            <path d="M9 16.7L5.5 13.2C5.11 12.81 4.49 12.81 4.1 13.2C3.71 13.59 3.71 14.21 4.1 14.6L8.29 18.79C8.68 19.18 9.31 19.18 9.7 18.79L20.3 8.20001C20.69 7.81001 20.69 7.19001 20.3 6.80001C19.91 6.41001 19.29 6.41001 18.9 6.80001L9 16.7Z" fill="#4C4C4C"/>
                                                                        </svg>
                                                                    </button>
                                                                    <button className="action-btn cancel" onClick={cancelEdit}>
                                                                        <svg width="14" height="15" viewBox="0 0 14 15" xmlns="http://www.w3.org/2000/svg">
                                                                            <path d="M13.3 1.20997C12.91 0.819971 12.28 0.819971 11.89 1.20997L7 6.08997L2.11 1.19997C1.72 0.809971 1.09 0.809971 0.700001 1.19997C0.310001 1.58997 0.310001 2.21997 0.700001 2.60997L5.59 7.49997L0.700001 12.39C0.310001 12.78 0.310001 13.41 0.700001 13.8C1.09 14.19 1.72 14.19 2.11 13.8L7 8.90997L11.89 13.8C12.28 14.19 12.91 14.19 13.3 13.8C13.69 13.41 13.69 12.78 13.3 12.39L8.41 7.49997L13.3 2.60997C13.68 2.22997 13.68 1.58997 13.3 1.20997Z" fill="#4C4C4C"/>
                                                                        </svg>
                                                                    </button>
                                                                </div>
                                                            ) : (
                                                                <div className="more" onClick={() => handleMoreClick(item.id, 'group')}>
                                                                    <svg width="16" height="5" viewBox="0 0 16 5" fill="none" xmlns="http://www.w3.org/2000/svg">
                                                                        <path d="M2 0.5C0.9 0.5 0 1.4 0 2.5C0 3.6 0.9 4.5 2 4.5C3.1 4.5 4 3.6 4 2.5C4 1.4 3.1 0.5 2 0.5ZM14 0.5C12.9 0.5 12 1.4 12 2.5C12 3.6 12.9 4.5 14 4.5C15.1 4.5 16 3.6 16 2.5C16 1.4 15.1 0.5 14 0.5ZM8 0.5C6.9 0.5 6 1.4 6 2.5C6 3.6 6.9 4.5 8 4.5C9.1 4.5 10 3.6 10 2.5C10 1.4 9.1 0.5 8 0.5Z"/>
                                                                    </svg>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                ))
                            }
                        </div>
                    )
                }
                
            </div>
            {/* MoreOption 모달 */}
            {moreOption && (
                <div className="more-option">
                    <div className="more-option__overlay" onClick={closeMoreOption}></div>
                    <div className="more-option__container">
                        <p className="more-title">{getSelectedTodo()?.text || '할 일 옵션'}</p>
                        <p className="more-sub" onClick={handleEditTodo}>수정하기</p>
                        <p className="more-sub" onClick={handleDeleteTodo}>삭제하기</p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default TodoList;
