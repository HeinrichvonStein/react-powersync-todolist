import React from 'react';
import { ListItem, IconButton, ListItemAvatar, ListItemText, Box, styled, Paper, ListItemButton, Checkbox, Typography } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import CheckBoxOutlineBlankIcon from '@mui/icons-material/CheckBoxOutlineBlank';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import { formatDateTime } from '@/utils/dateUtils';

export type TodoItemWidgetProps = {
  description: string | null;
  isComplete: boolean;
  onDelete: () => void;
  toggleCompletion: () => void;
  isSelected?: boolean;
  onSelect?: (selected: boolean) => void;
  showSelection?: boolean;
  completedAt?: string | null;
};

export const TodoItemWidget: React.FC<TodoItemWidgetProps> = (props) => {
  return (
    <S.MainPaper elevation={1}>
      <ListItem
        disablePadding
        secondaryAction={
          <Box>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={() => {
                props.onDelete();
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        }
      >
        {props.showSelection && (
          <Checkbox
            edge="start"
            checked={props.isSelected}
            onChange={(e) => props.onSelect?.(e.target.checked)}
            inputProps={{ 'aria-label': 'Select todo item' }}
            sx={{ ml: 1 }}
          />
        )}
        <ListItemButton
          onClick={() => {
            props.toggleCompletion();
          }}
        >
          <ListItemAvatar>
            <IconButton edge="end" aria-label="toggle completion">
              {props.isComplete ? <CheckBoxIcon /> : <CheckBoxOutlineBlankIcon />}
            </IconButton>
          </ListItemAvatar>
          <Box sx={{ flexGrow: 1 }}>
            <ListItemText
              primary={props.description}
              secondary={
                props.isComplete && props.completedAt && (
                  <Typography component="span" variant="caption" color="text.secondary">
                    Completed {formatDateTime(props.completedAt)}
                  </Typography>
                )
              }
            />
          </Box>
        </ListItemButton>
      </ListItem>
    </S.MainPaper>
  );
};

namespace S {
  export const MainPaper = styled(Paper)`
    margin-bottom: 10px;
  `;
}