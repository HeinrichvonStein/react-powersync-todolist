import { usePowerSync, useQuery } from '@powersync/react';
import AddIcon from '@mui/icons-material/Add';
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  List,
  TextField,
  Typography,
  styled,
  Checkbox,
  Alert,
  Snackbar,
  FormControlLabel
} from '@mui/material';
import Fab from '@mui/material/Fab';
import React, { Suspense } from 'react';
import { useParams } from 'react-router-dom';
import { useSupabase } from '@/components/providers/SystemProvider';
import { LISTS_TABLE, TODOS_TABLE, TodoRecord } from '@/library/powersync/AppSchema';
import { NavigationPage } from '@/components/navigation/NavigationPage';
import { TodoItemWidget } from '@/components/widgets/TodoItemWidget';

const TodoEditSection = () => {
  const powerSync = usePowerSync();
  const supabase = useSupabase();
  const { id: listID } = useParams();

  const {
    data: [listRecord]
  } = useQuery<{ name: string }>(`SELECT name FROM ${LISTS_TABLE} WHERE id = ?`, [listID]);

  const { data: todos } = useQuery<TodoRecord>(
    `SELECT * FROM ${TODOS_TABLE} WHERE list_id=? ORDER BY created_at DESC, id`,
    [listID]
  );

  const [showPrompt, setShowPrompt] = React.useState(false);
  const [showBulkConfirm, setShowBulkConfirm] = React.useState(false);
  const [selectedTodos, setSelectedTodos] = React.useState<Set<string>>(new Set());
  const [showSuccessMessage, setShowSuccessMessage] = React.useState(false);
  const nameInputRef = React.createRef<HTMLInputElement>();

  const incompleteTodos = todos.filter(todo => !todo.completed);
  const hasSelection = selectedTodos.size > 0;

  const toggleCompletion = async (record: TodoRecord, completed: boolean) => {
    const updatedRecord = { ...record, completed: completed };
    if (completed) {
      const userID = supabase?.currentSession?.user.id;
      if (!userID) {
        throw new Error(`Could not get user ID.`);
      }
      updatedRecord.completed_at = new Date().toISOString();
      updatedRecord.completed_by = userID;
    } else {
      updatedRecord.completed_at = null;
      updatedRecord.completed_by = null;
    }
    await powerSync.execute(
      `UPDATE ${TODOS_TABLE}
              SET completed = ?,
                  completed_at = ?,
                  completed_by = ?
              WHERE id = ?`,
      [completed, updatedRecord.completed_at, updatedRecord.completed_by, record.id]
    );
  };

  const completeBulkTodos = async () => {
    const userID = supabase?.currentSession?.user.id;
    if (!userID) {
      throw new Error(`Could not get user ID.`);
    }

    const completedAt = new Date().toISOString();

    await powerSync.writeTransaction(async (tx) => {
      for (const todoId of selectedTodos) {
        await tx.execute(
          `UPDATE ${TODOS_TABLE}
           SET completed = ?,
               completed_at = ?,
               completed_by = ?
           WHERE id = ?`,
          [true, completedAt, userID, todoId]
        );
      }
    });

    setSelectedTodos(new Set());
    setShowBulkConfirm(false);
    setShowSuccessMessage(true);
  };

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedTodos(new Set(incompleteTodos.map(todo => todo.id)));
    } else {
      setSelectedTodos(new Set());
    }
  };

  const toggleTodoSelection = (todoId: string, selected: boolean) => {
    const newSelection = new Set(selectedTodos);
    if (selected) {
      newSelection.add(todoId);
    } else {
      newSelection.delete(todoId);
    }
    setSelectedTodos(newSelection);
  };

  const createNewTodo = async (description: string) => {
    const userID = supabase?.currentSession?.user.id;
    if (!userID) {
      throw new Error(`Could not get user ID.`);
    }

    await powerSync.execute(
      `INSERT INTO
                ${TODOS_TABLE}
                    (id, created_at, created_by, description, list_id)
                VALUES
                    (uuid(), datetime(), ?, ?, ?)`,
      [userID, description, listID!]
    );
  };

  const deleteTodo = async (id: string) => {
    await powerSync.writeTransaction(async (tx) => {
      await tx.execute(`DELETE FROM ${TODOS_TABLE} WHERE id = ?`, [id]);
    });
  };

  if (!listRecord) {
    return (
      <Box>
        <Typography>No matching List found, please navigate back...</Typography>
      </Box>
    );
  }

  return (
    <NavigationPage title={`Todo List: ${listRecord.name}`}>
      <Box>
        <S.FloatingActionButton onClick={() => setShowPrompt(true)}>
          <AddIcon />
        </S.FloatingActionButton>

        <Box sx={{ mb: 2 }}>
          {incompleteTodos.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={selectedTodos.size === incompleteTodos.length}
                    indeterminate={selectedTodos.size > 0 && selectedTodos.size < incompleteTodos.length}
                    onChange={(e) => toggleSelectAll(e.target.checked)}
                  />
                }
                label="Select All"
              />
              {hasSelection && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setShowBulkConfirm(true)}
                >
                  Complete Selected ({selectedTodos.size})
                </Button>
              )}
            </Box>
          )}

          <List dense={false}>
            {todos.map((r) => (
              <TodoItemWidget
                key={r.id}
                description={r.description}
                onDelete={() => deleteTodo(r.id)}
                isComplete={r.completed == 1}
                toggleCompletion={() => toggleCompletion(r, !r.completed)}
                showSelection={!r.completed}
                isSelected={selectedTodos.has(r.id)}
                onSelect={(selected) => toggleTodoSelection(r.id, selected)}
              />
            ))}
          </List>
        </Box>

        <Dialog
          open={showPrompt}
          onClose={() => setShowPrompt(false)}
          aria-labelledby="create-dialog-title"
          PaperProps={{
            component: 'form',
            onSubmit: async (event: React.FormEvent<HTMLFormElement>) => {
              event.preventDefault();
              await createNewTodo(nameInputRef.current!.value);
              setShowPrompt(false);
            }
          }}
        >
          <DialogTitle id="create-dialog-title">Create Todo Item</DialogTitle>
          <DialogContent>
            <DialogContentText>Enter a description for a new todo item</DialogContentText>
            <TextField sx={{ marginTop: '10px' }} fullWidth inputRef={nameInputRef} autoFocus label="Task Name" />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowPrompt(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </DialogActions>
        </Dialog>

        <Dialog
          open={showBulkConfirm}
          onClose={() => setShowBulkConfirm(false)}
          aria-labelledby="bulk-confirm-dialog-title"
        >
          <DialogTitle id="bulk-confirm-dialog-title">Complete Multiple Items</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to mark {selectedTodos.size} items as complete?
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowBulkConfirm(false)}>Cancel</Button>
            <Button onClick={completeBulkTodos} variant="contained" color="primary">
              Complete Items
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={showSuccessMessage}
          autoHideDuration={3000}
          onClose={() => setShowSuccessMessage(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setShowSuccessMessage(false)} severity="success" sx={{ width: '100%' }}>
            Successfully completed {selectedTodos.size} items
          </Alert>
        </Snackbar>
      </Box>
    </NavigationPage>
  );
};

export default function TodoEditPage() {
  return (
    <Box>
      <Suspense fallback={<CircularProgress />}>
        <TodoEditSection />
      </Suspense>
    </Box>
  );
}

namespace S {
  export const FloatingActionButton = styled(Fab)`
    position: fixed;
    bottom: 20px;
    right: 20px;
  `;
}