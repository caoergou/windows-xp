import React from 'react';
import { useTranslation } from 'react-i18next';
import { AddFavoriteModal as Modal, ModalTitle, ModalInput, ModalButtons, ModalButton } from '../styled';

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
      <ModalTitle>{title}</ModalTitle>
      <ModalInput
        type="text"
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder={title}
        autoFocus
      />
      <ModalButtons>
        <ModalButton onClick={onCancel}>{t('shutdown.cancel')}</ModalButton>
        <ModalButton className="primary" onClick={onSave}>
          {t('contextMenu.new')}
        </ModalButton>
      </ModalButtons>
    </Modal>
  );
};

export default AddFavoriteModal;
