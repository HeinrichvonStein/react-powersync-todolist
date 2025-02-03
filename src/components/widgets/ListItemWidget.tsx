import React from 'react';
import {
  ListItem,
  IconButton,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Box,
  Paper,
  styled,
  ListItemButton,
  Typography
} from '@mui/material';

import DeleteIcon from '@mui/icons-material/DeleteOutline';
import RightIcon from '@mui/icons-material/ArrowRightAlt';
import ListIcon from '@mui/icons-material/ListAltOutlined';
import { formatDateTime } from '@/utils/dateUtils';

export type ListItemWidgetProps = {
  title: string;
  description: string;
  selected?: boolean;
  onDelete: () => void;
  onPress: () => void;
  createdAt: string;
};

export const ListItemWidget: React.FC<ListItemWidgetProps> = (props) => {
  return (
    <S.MainPaper elevation={1}>
      <ListItem
        disablePadding
        secondaryAction={
          <Box>
            <IconButton
              edge="end"
              aria-label="delete"
              onClick={(event) => {
                props.onDelete();
              }}
            >
              <DeleteIcon />
            </IconButton>
            <IconButton
              edge="end"
              aria-label="proceed"
              onClick={(event) => {
                props.onPress();
              }}
            >
              <RightIcon />
            </IconButton>
          </Box>
        }
      >
        <ListItemButton
          onClick={(event) => {
            props.onPress();
          }}
          selected={props.selected}
        >
          <ListItemAvatar>
            <Avatar>
              <ListIcon />
            </Avatar>
          </ListItemAvatar>
          <Box sx={{ flexGrow: 1 }}>
            <ListItemText 
              primary={props.title} 
              secondary={
                <React.Fragment>
                  <Typography component="span" variant="body2" color="text.primary">
                    {props.description}
                  </Typography>
                  <br />
                  <Typography component="span" variant="caption" color="text.secondary">
                    Created {formatDateTime(props.createdAt)}
                  </Typography>
                </React.Fragment>
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