from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator


CommentChannel = Literal["music", "guestbook"]
CommentStatus = Literal["pending", "approved", "rejected", "deleted"]


def _clean_text(value: str) -> str:
    return " ".join(value.replace("\u0000", "").split())


class SongReference(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=120)
    artist: str = Field(min_length=1, max_length=120)

    @field_validator("id", "title", "artist")
    @classmethod
    def normalize_fields(cls, value: str) -> str:
        return _clean_text(value)


class PublicCommentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    channel: CommentChannel
    authorName: str = Field(min_length=2, max_length=24)
    content: str = Field(min_length=2, max_length=300)
    song: SongReference | None = None

    @field_validator("authorName", "content")
    @classmethod
    def normalize_text_fields(cls, value: str) -> str:
        return _clean_text(value)

    @model_validator(mode="after")
    def validate_channel_payload(self):
        if self.channel == "music" and self.song is None:
            raise ValueError("音乐留言必须选择对应歌曲")
        if self.channel == "guestbook" and self.song is not None:
            raise ValueError("留言板不能包含歌曲信息")
        return self


class AdminCommentUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    status: CommentStatus | None = None
    reply: str | None = Field(default=None, max_length=500)

    @field_validator("reply")
    @classmethod
    def normalize_reply(cls, value: str | None) -> str | None:
        if value is None:
            return None
        normalized = _clean_text(value)
        return normalized or None

    @model_validator(mode="after")
    def require_change(self):
        if not self.model_fields_set:
            raise ValueError("至少提供一个需要更新的字段")
        return self
