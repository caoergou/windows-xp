import React from 'react';
import { useTranslation } from 'react-i18next';
import XPIcon from '../../../components/XPIcon';
import {
  AddFavoriteModal as Modal,
  ModalHeader,
  ModalTitle,
  ModalBody,
  ModalInput,
  ModalButtons,
  ModalButton,
} from '../styled';

interface AddFavoriteModalProps {
  name: string;
  onNameChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
}

const AddFavoriteModal: React.FC<AddFavoriteModalProps> = ({
  name,
  onNameChange,
  onSave,
  onCancel,
}) => {
  const { t } = useTranslation();
  const title = t('internetExplorer.menuitems.addToFavorites').replace('(A)...', '');

  return (
    <Modal>
      <ModalHeader>
        <ModalTitle>{title}</ModalTitle>
        <XPIcon
          name="close"
          size={14}
          color="white"
          style={{ cursor: 'pointer' }}
          onClick={onCancel}
        />
      </ModalHeader>
      <ModalBody>
        <ModalInput
          type="text"
          value={name}
          onChange={e => onNameChange(e.target.value)}
          placeholder={title}
          autoFocus
        />
      </ModalBody>
      <ModalButtons>
        <ModalButton onClick={onCancel}>{t('common.cancel')}</ModalButton>
        <ModalButton onClick={onSave}>{t('common.ok')}</ModalButton>
      </ModalButtons>
    </Modal>
  );
};

export default AddFavoriteModal;
